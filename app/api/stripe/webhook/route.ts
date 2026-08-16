// POST /api/stripe/webhook
// À déclarer dans le dashboard Stripe sur les événements :
//   - account.updated                 (suivi de l'onboarding Connect)
//   - payment_intent.succeeded        (paiement voyageur réussi)
//   - payment_intent.payment_failed

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { computeFees } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Signature invalide : ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as any;
      // Un compte Express est opérationnel dès que ces deux conditions sont réunies
      const complete = account.charges_enabled && account.payouts_enabled;

      await supabase
        .from("profiles")
        .update({ stripe_onboarding_complete: complete })
        .eq("stripe_account_id", account.id);
      break;
    }

    case "payment_intent.succeeded": {
      const intent = event.data.object as any;
      const reservationId = intent.metadata?.reservation_id;
      if (!reservationId) break;

      const amountTotal = intent.amount;

      const { data: reservation } = await supabase
        .from("reservations")
        .select("id, listing_id, tourist_tax_amount, listings(host_id)")
        .eq("id", reservationId)
        .single();

      const hostId = (reservation as any)?.listings?.host_id;
      const touristTaxAmount = (reservation as any)?.tourist_tax_amount ?? 0;

      // La rétrocommission suit le statut super-hôte ACTIF au moment du
      // paiement (partner_host_grants), pas un simple tag statique sur le
      // profil : si l'hôte a révoqué l'accès de sa conciergerie, la
      // rétrocommission s'arrête automatiquement dès la réservation
      // suivante, sans intervention manuelle.
      const { data: octroiActif } = await supabase
        .from("partner_host_grants")
        .select("partner_id")
        .eq("host_id", hostId)
        .eq("status", "actif")
        .maybeSingle();

      const partnerId = octroiActif?.partner_id ?? null;
      const { platformFee, partnerFee, amountHost } = computeFees(amountTotal, { hasPartner: !!partnerId, touristTaxAmount });

      // Le paiement est enregistré "succeeded" mais transferred_at reste null :
      // les fonds sont retenus par Escale jusqu'à la fin du séjour.
      await supabase.from("payments").upsert(
        {
          reservation_id: reservationId,
          host_id: hostId,
          stripe_payment_intent_id: intent.id,
          amount_total: amountTotal,
          platform_fee: platformFee,
          amount_host: amountHost,
          partner_id: partnerId,
          partner_fee: partnerId ? partnerFee : null,
          currency: intent.currency,
          status: "succeeded",
        },
        { onConflict: "stripe_payment_intent_id" }
      );

      await supabase
        .from("reservations")
        .update({ status: "confirmee" })
        .eq("id", reservationId);

      // Si une caution est prévue, on mémorise le client et le moyen de
      // paiement Stripe (enregistrés via setup_future_usage au checkout)
      // pour pouvoir autoriser la caution séparément à l'arrivée.
      if (intent.customer && intent.payment_method) {
        await supabase
          .from("reservations")
          .update({
            deposit_customer_id: intent.customer,
            deposit_payment_method_id: intent.payment_method,
            deposit_status: "carte_enregistree",
          })
          .eq("id", reservationId)
          .not("deposit_amount", "is", null);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as any;
      const reservationId = intent.metadata?.reservation_id;
      if (reservationId) {
        await supabase
          .from("payments")
          .upsert(
            { stripe_payment_intent_id: intent.id, status: "failed", reservation_id: reservationId },
            { onConflict: "stripe_payment_intent_id" }
          );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
