// GET /api/cron/release-payments
// Déclenchée automatiquement chaque jour (voir vercel.json).
// Recherche les séjours terminés dont le paiement n'a pas encore été
// reversé à l'hôte, et déclenche le virement Stripe correspondant.
//
// Délai de sécurité : on ne libère les fonds que N jours après la date de
// fin de séjour (le temps que le voyageur puisse signaler un problème).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Nombre de jours de rétention après la fin du séjour avant reversement
const DELAI_RETENTION_JOURS = 1;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() - DELAI_RETENTION_JOURS);
  const dateLimiteISO = dateLimite.toISOString().slice(0, 10);

  // Paiements réussis, non encore transférés, dont le séjour est terminé
  // depuis au moins DELAI_RETENTION_JOURS et sans signalement actif.
  const { data: paiements, error } = await supabase
    .from("payments")
    .select(`
      id, stripe_payment_intent_id, amount_host, host_id, status, transferred_at,
      partner_id, partner_fee, partner_transferred_at,
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
      const { data: hote } = await supabase
        .from("profiles")
        .select("stripe_account_id, stripe_onboarding_complete")
        .eq("id", paiement.host_id)
        .single();

      if (!hote?.stripe_account_id || !hote.stripe_onboarding_complete) {
        resultats.push({ paymentId: paiement.id, status: "skipped_no_account" });
        continue;
      }

      const transfer = await stripe.transfers.create({
        amount: paiement.amount_host,
        currency: "eur",
        destination: hote.stripe_account_id,
        transfer_group: `reservation_${(paiement as any).reservations.id}`,
        // Remarque : on peut aussi passer "source_transaction" avec l'ID de
        // charge (pas le payment_intent) pour rattacher visuellement ce
        // virement au paiement d'origine dans le dashboard Stripe.
      });

      await supabase
        .from("payments")
        .update({ transferred_at: new Date().toISOString(), stripe_transfer_id: transfer.id })
        .eq("id", paiement.id);

      resultats.push({ paymentId: paiement.id, status: "transferred" });

      // Reversement de la rétrocommission au partenaire conciergerie, le cas
      // échéant — indépendant du virement à l'hôte, jamais bloquant pour lui.
      if (paiement.partner_id && paiement.partner_fee && !paiement.partner_transferred_at) {
        const { data: partenaire } = await supabase
          .from("partners")
          .select("stripe_account_id, stripe_onboarding_complete")
          .eq("id", paiement.partner_id)
          .single();

        if (partenaire?.stripe_account_id && partenaire.stripe_onboarding_complete) {
          const transferPartenaire = await stripe.transfers.create({
            amount: paiement.partner_fee,
            currency: "eur",
            destination: partenaire.stripe_account_id,
            transfer_group: `reservation_${(paiement as any).reservations.id}_partenaire`,
          });
          await supabase
            .from("payments")
            .update({ partner_transferred_at: new Date().toISOString(), stripe_partner_transfer_id: transferPartenaire.id })
            .eq("id", paiement.id);
        }
      }

      // Même logique de rétention pour la caution : on la libère en même
      // temps que le paiement principal, uniquement si elle est encore
      // "autorisee" (pas déjà libérée ou prélevée pour un autre motif).
      const reservationId = (paiement as any).reservations.id;
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
