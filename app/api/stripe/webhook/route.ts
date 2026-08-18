// POST /api/stripe/webhook
// Webhook Stripe : paiements carte, Connect et abonnement hôte.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { stripe, computeFees } from "@/lib/stripe/client";
import { debutMoisProchain } from "@/lib/stripe/subscription";
import type { FormuleTarifaire } from "@/lib/pricing";

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
        .select("id, listing_id, start_date, tourist_tax_amount, listings(host_id)")
        .eq("id", reservationId)
        .single();

      const hostId = (reservation as any)?.listings?.host_id;
      const touristTaxAmount = (reservation as any)?.tourist_tax_amount ?? 0;
      if (!hostId) break;

      const { data: formuleLue } = await supabase.rpc("formule_hote_a", {
        p_host_id: hostId,
        p_date: (reservation as any)?.start_date ?? new Date().toISOString(),
      });
      const formule = (formuleLue as FormuleTarifaire) ?? "commission";

      const { data: octroiActif } = await supabase
        .from("partner_host_grants")
        .select("partner_id")
        .eq("host_id", hostId)
        .eq("status", "actif")
        .maybeSingle();

      const partnerId = octroiActif?.partner_id ?? null;
      const {
        platformFee,
        partnerFee,
        amountHost,
        touristTaxHeld,
        tauxCommission,
      } = computeFees(amountTotal, {
        hasPartner: !!partnerId,
        touristTaxAmount,
        formule,
      });

      await supabase.from("payments").upsert(
        {
          reservation_id: reservationId,
          host_id: hostId,
          stripe_payment_intent_id: intent.id,
          provider_payment_id: intent.id,
          payment_provider: "stripe",
          payment_channel: intent.metadata?.payment_channel ?? "card",
          amount_total: amountTotal,
          platform_fee: platformFee,
          amount_host: amountHost,
          tourist_tax_held: touristTaxHeld,
          partner_id: partnerId,
          partner_fee: partnerId ? partnerFee : null,
          currency: intent.currency,
          status: "succeeded",
          pricing_plan: formule,
          commission_rate_applied: tauxCommission,
        },
        { onConflict: "stripe_payment_intent_id" }
      );

      await supabase
        .from("reservations")
        .update({ status: "confirmee" })
        .eq("id", reservationId);

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
        await supabase.from("payments").upsert(
          {
            stripe_payment_intent_id: intent.id,
            provider_payment_id: intent.id,
            payment_provider: "stripe",
            payment_channel: intent.metadata?.payment_channel ?? "card",
            status: "failed",
            reservation_id: reservationId,
          },
          { onConflict: "stripe_payment_intent_id" }
        );
      }
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as any;
      if (session.mode !== "subscription") break;
      const hostId = session.metadata?.host_id;
      if (!hostId) break;

      await supabase
        .from("profiles")
        .update({
          stripe_customer_id: session.customer,
          subscription_id: session.subscription,
          subscription_status: "active",
        })
        .eq("id", hostId);

      await supabase.rpc("basculer_formule_hote", {
        p_host_id: hostId,
        p_plan: "abonnement",
        p_effective: debutMoisProchain().toISOString(),
        p_cause: "souscription",
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const facture = event.data.object as any;
      if (!facture.subscription) break;
      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_current_period_end: facture.period_end
            ? new Date(facture.period_end * 1000).toISOString()
            : null,
        })
        .eq("subscription_id", facture.subscription);
      break;
    }

    case "invoice.payment_failed": {
      const facture = event.data.object as any;
      if (!facture.subscription) break;
      await supabase
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("subscription_id", facture.subscription);
      break;
    }

    case "customer.subscription.updated": {
      const abonnement = event.data.object as any;
      await supabase
        .from("profiles")
        .update({
          subscription_status: abonnement.status,
          subscription_current_period_end: abonnement.current_period_end
            ? new Date(abonnement.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("subscription_id", abonnement.id);
      break;
    }

    case "customer.subscription.deleted": {
      const abonnement = event.data.object as any;
      const { data: profil } = await supabase
        .from("profiles")
        .select("id")
        .eq("subscription_id", abonnement.id)
        .maybeSingle();
      if (!profil) break;

      await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_id: null,
          subscription_current_period_end: null,
        })
        .eq("id", profil.id);

      await supabase.rpc("basculer_formule_hote", {
        p_host_id: profil.id,
        p_plan: "commission",
        p_effective: new Date().toISOString(),
        p_cause: abonnement.cancel_at_period_end ? "resiliation" : "echec_paiement",
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
