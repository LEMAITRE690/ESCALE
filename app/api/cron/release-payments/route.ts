// GET /api/cron/release-payments
// Reverse automatiquement les fonds après la fin du séjour et le délai de
// sécurité. Stripe et Lemonway partagent désormais la même orchestration.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { createMoneyOut, createP2P, findMoneyOutByReference } from "@/lib/lemonway/client";
import { VAT_RATE } from "@/lib/pricing";

const DELAI_RETENTION_JOURS = 1;
const DELAI_RECONCILIATION_MINUTES = 30;

type Resultat = { paymentId: string; status: string; error?: string };

function tropRecentPourRejouer(dateIso?: string | null) {
  if (!dateIso) return false;
  const ageMs = Date.now() - new Date(dateIso).getTime();
  return ageMs >= 0 && ageMs < DELAI_RECONCILIATION_MINUTES * 60_000;
}

async function facturerCommission(paymentId: string, resultats: Resultat[]) {
  const { error } = await supabase.rpc("creer_facture_commission", {
    p_payment_id: paymentId,
    p_vat_rate: VAT_RATE,
  });
  if (error) {
    resultats.push({ paymentId, status: "invoice_failed", error: error.message });
  }
}

async function libererCaution(req: NextRequest, reservationId: string) {
  const { data: resa } = await supabase
    .from("reservations")
    .select("deposit_status")
    .eq("id", reservationId)
    .single();

  if (resa?.deposit_status === "autorisee") {
    await fetch(`${req.nextUrl.origin}/api/deposits/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    }).catch(() => {});
  }
}

async function traiterStripe(req: NextRequest, paiement: any, resultats: Resultat[]) {
  const { data: hote } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", paiement.host_id)
    .single();

  if (!hote?.stripe_account_id || !hote.stripe_onboarding_complete) {
    resultats.push({ paymentId: paiement.id, status: "skipped_no_account" });
    return;
  }

  const reservationId = paiement.reservations.id;
  const transfer = await stripe.transfers.create(
    {
      amount: paiement.amount_host,
      currency: "eur",
      destination: hote.stripe_account_id,
      transfer_group: `reservation_${reservationId}`,
      metadata: { payment_id: paiement.id, reservation_id: reservationId, beneficiary: "host" },
    },
    { idempotencyKey: `escale-host-transfer-${paiement.id}` }
  );

  const { error: erreurMaj } = await supabase
    .from("payments")
    .update({ transferred_at: new Date().toISOString(), stripe_transfer_id: transfer.id })
    .eq("id", paiement.id)
    .is("transferred_at", null);

  if (erreurMaj) throw new Error(`Transfert Stripe effectué mais journalisation impossible: ${erreurMaj.message}`);

  resultats.push({ paymentId: paiement.id, status: "transferred" });
  await facturerCommission(paiement.id, resultats);

  if (paiement.partner_id && paiement.partner_fee && !paiement.partner_transferred_at) {
    const { data: partenaire } = await supabase
      .from("partners")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", paiement.partner_id)
      .single();

    if (partenaire?.stripe_account_id && partenaire.stripe_onboarding_complete) {
      const transferPartenaire = await stripe.transfers.create(
        {
          amount: paiement.partner_fee,
          currency: "eur",
          destination: partenaire.stripe_account_id,
          transfer_group: `reservation_${reservationId}_partenaire`,
          metadata: { payment_id: paiement.id, reservation_id: reservationId, beneficiary: "partner" },
        },
        { idempotencyKey: `escale-partner-transfer-${paiement.id}` }
      );

      await supabase
        .from("payments")
        .update({
          partner_transferred_at: new Date().toISOString(),
          stripe_partner_transfer_id: transferPartenaire.id,
        })
        .eq("id", paiement.id)
        .is("partner_transferred_at", null);
    }
  }

  await libererCaution(req, reservationId);
}

async function traiterLemonway(req: NextRequest, paiement: any, resultats: Resultat[]) {
  if (process.env.LEMONWAY_PAYOUTS_ENABLED !== "true") {
    resultats.push({ paymentId: paiement.id, status: "skipped_lemonway_payouts_disabled" });
    return;
  }

  const collectionAccountId = process.env.LEMONWAY_COLLECTION_ACCOUNT_ID;
  if (!collectionAccountId) throw new Error("LEMONWAY_COLLECTION_ACCOUNT_ID manquant");

  const { data: hote } = await supabase
    .from("profiles")
    .select("lemonway_account_id, lemonway_iban_id, lemonway_payout_enabled, lemonway_onboarding_complete, lemonway_kyc_status")
    .eq("id", paiement.host_id)
    .single();

  if (!hote?.lemonway_account_id || !hote.lemonway_payout_enabled || !hote.lemonway_onboarding_complete) {
    resultats.push({ paymentId: paiement.id, status: "skipped_host_not_payout_ready" });
    return;
  }

  const reservationId = paiement.reservations.id;
  const tentativeMaintenant = new Date().toISOString();

  // P2P collection -> Payment Account de l'hôte. Un drapeau de tentative est
  // écrit AVANT l'appel externe : si le serveur tombe entre Lemonway et la DB,
  // le cron ne rejoue pas immédiatement une opération potentiellement réussie.
  if (!paiement.provider_host_transfer_id) {
    if (tropRecentPourRejouer(paiement.payout_attempted_at)) {
      resultats.push({ paymentId: paiement.id, status: "reconciliation_required" });
      return;
    }

    await supabase
      .from("payments")
      .update({ payout_attempted_at: tentativeMaintenant, payout_last_error: null })
      .eq("id", paiement.id);

    const p2p = await createP2P({
      debitAccountId: collectionAccountId,
      creditAccountId: hote.lemonway_account_id,
      amount: paiement.amount_host,
      reference: `host-${paiement.id}`,
      comment: `Escale resa ${reservationId} net hote`,
    });

    const { error: logP2pError } = await supabase
      .from("payments")
      .update({ provider_host_transfer_id: p2p.id })
      .eq("id", paiement.id);
    if (logP2pError) throw new Error(`P2P Lemonway effectué mais non journalisé: ${logP2pError.message}`);
    paiement.provider_host_transfer_id = p2p.id;
  }

  // Money-Out vers l'IBAN vérifié. Ici Lemonway permet la recherche par
  // référence : on réconcilie avant de créer pour éviter un double payout.
  if (!paiement.provider_host_payout_id) {
    const reference = `payout-host-${paiement.id}`.slice(0, 50);
    const existant = await findMoneyOutByReference(reference);
    let moneyOutId: string;

    if (existant?.id || existant?.transactionId) {
      moneyOutId = String(existant.id ?? existant.transactionId);
    } else {
      const moneyOut = await createMoneyOut({
        accountId: hote.lemonway_account_id,
        ibanId: hote.lemonway_iban_id,
        amount: paiement.amount_host,
        reference,
        comment: `Escale resa ${reservationId}`,
      });
      moneyOutId = moneyOut.id;
    }

    const { error: logMoError } = await supabase
      .from("payments")
      .update({
        provider_host_payout_id: moneyOutId,
        transferred_at: new Date().toISOString(),
        payout_last_error: null,
      })
      .eq("id", paiement.id)
      .is("transferred_at", null);
    if (logMoError) throw new Error(`Money-Out Lemonway non journalisé: ${logMoError.message}`);
  }

  resultats.push({ paymentId: paiement.id, status: "transferred_lemonway" });
  await facturerCommission(paiement.id, resultats);

  if (paiement.partner_id && paiement.partner_fee && !paiement.partner_transferred_at) {
    const { data: partenaire } = await supabase
      .from("partners")
      .select("lemonway_account_id, lemonway_iban_id, lemonway_payout_enabled, lemonway_onboarding_complete")
      .eq("id", paiement.partner_id)
      .single();

    if (partenaire?.lemonway_account_id && partenaire.lemonway_payout_enabled && partenaire.lemonway_onboarding_complete) {
      if (!paiement.provider_partner_transfer_id) {
        const p2pPartenaire = await createP2P({
          debitAccountId: collectionAccountId,
          creditAccountId: partenaire.lemonway_account_id,
          amount: paiement.partner_fee,
          reference: `part-${paiement.id}`,
          comment: `Escale resa ${reservationId} partenaire`,
        });
        await supabase
          .from("payments")
          .update({ provider_partner_transfer_id: p2pPartenaire.id })
          .eq("id", paiement.id);
      }

      const referencePartenaire = `payout-part-${paiement.id}`.slice(0, 50);
      const payoutExistant = await findMoneyOutByReference(referencePartenaire);
      let payoutPartenaireId = payoutExistant?.id ?? payoutExistant?.transactionId;
      if (!payoutPartenaireId) {
        const moneyOutPartenaire = await createMoneyOut({
          accountId: partenaire.lemonway_account_id,
          ibanId: partenaire.lemonway_iban_id,
          amount: paiement.partner_fee,
          reference: referencePartenaire,
          comment: `Escale resa ${reservationId} partenaire`,
        });
        payoutPartenaireId = moneyOutPartenaire.id;
      }

      await supabase
        .from("payments")
        .update({
          provider_partner_payout_id: String(payoutPartenaireId),
          partner_transferred_at: new Date().toISOString(),
        })
        .eq("id", paiement.id)
        .is("partner_transferred_at", null);
    }
  }

  await libererCaution(req, reservationId);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() - DELAI_RETENTION_JOURS);
  const dateLimiteISO = dateLimite.toISOString().slice(0, 10);

  const { data: paiements, error } = await supabase
    .from("payments")
    .select(`
      id, amount_host, host_id, status, transferred_at,
      partner_id, partner_fee, partner_transferred_at,
      payment_provider, provider_host_transfer_id, provider_partner_transfer_id,
      provider_host_payout_id, provider_partner_payout_id,
      payout_attempted_at, payout_last_error,
      reservations!inner ( id, end_date, has_open_dispute )
    `)
    .eq("status", "succeeded")
    .is("transferred_at", null)
    .lte("reservations.end_date", dateLimiteISO)
    .eq("reservations.has_open_dispute", false);

  if (error) {
    return NextResponse.json({ error: "Lecture des paiements impossible" }, { status: 500 });
  }

  const resultats: Resultat[] = [];

  for (const paiement of paiements ?? []) {
    try {
      if ((paiement as any).payment_provider === "lemonway") {
        await traiterLemonway(req, paiement as any, resultats);
      } else {
        await traiterStripe(req, paiement as any, resultats);
      }
    } catch (err: any) {
      const message = String(err?.message ?? err);
      await supabase
        .from("payments")
        .update({ payout_last_error: message, payout_attempted_at: new Date().toISOString() })
        .eq("id", (paiement as any).id);
      resultats.push({ paymentId: (paiement as any).id, status: "error", error: message });
    }
  }

  return NextResponse.json({ traite: resultats.length, resultats });
}
