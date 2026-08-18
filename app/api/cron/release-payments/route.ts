// GET /api/cron/release-payments
// Reverse les fonds après la fin du séjour. Les transferts Stripe utilisent
// des clés d'idempotence déterministes : si le processus tombe après le
// virement mais avant l'écriture Supabase, un rejeu ne peut pas payer deux fois.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { VAT_RATE } from "@/lib/pricing";

const DELAI_RETENTION_JOURS = 1;

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
      payment_provider,
      reservations!inner ( id, end_date, has_open_dispute )
    `)
    .eq("status", "succeeded")
    .is("transferred_at", null)
    .lte("reservations.end_date", dateLimiteISO)
    .eq("reservations.has_open_dispute", false);

  if (error) {
    return NextResponse.json({ error: "Lecture des paiements impossible" }, { status: 500 });
  }

  const resultats: Array<{ paymentId: string; status: string; error?: string }> = [];

  for (const paiement of paiements ?? []) {
    try {
      // Tant qu'un second PSP n'est pas branché, ce cron ne traite que Stripe.
      // La future couche PaymentProvider prendra le relais pour Lemonway.
      if ((paiement as any).payment_provider && (paiement as any).payment_provider !== "stripe") {
        resultats.push({ paymentId: paiement.id, status: "skipped_provider" });
        continue;
      }

      const { data: hote } = await supabase
        .from("profiles")
        .select("stripe_account_id, stripe_onboarding_complete")
        .eq("id", paiement.host_id)
        .single();

      if (!hote?.stripe_account_id || !hote.stripe_onboarding_complete) {
        resultats.push({ paymentId: paiement.id, status: "skipped_no_account" });
        continue;
      }

      const reservationId = (paiement as any).reservations.id;
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

      if (erreurMaj) {
        // Le transfert Stripe reste sûr : le prochain rejeu réutilisera la
        // même clé d'idempotence et récupérera le même transfert.
        throw new Error(`Transfert effectué mais journalisation impossible: ${erreurMaj.message}`);
      }

      resultats.push({ paymentId: paiement.id, status: "transferred" });

      const { error: erreurFacture } = await supabase.rpc("creer_facture_commission", {
        p_payment_id: paiement.id,
        p_vat_rate: VAT_RATE,
      });
      if (erreurFacture) {
        resultats.push({
          paymentId: paiement.id,
          status: "invoice_failed",
          error: erreurFacture.message,
        });
      }

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
    } catch (err: any) {
      resultats.push({ paymentId: paiement.id, status: "error", error: String(err?.message ?? err) });
    }
  }

  return NextResponse.json({ traite: resultats.length, resultats });
}
