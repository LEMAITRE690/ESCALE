// POST /api/payments/card
// Canal carte secondaire. Stripe reste disponible pendant le déploiement de
// Pay by Bank, mais le domaine réservation ne redirige plus directement ici.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const auth = createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour payer cette réservation." }, { status: 401 });
  }

  const { reservationId } = await req.json();
  if (!reservationId) {
    return NextResponse.json({ error: "Réservation requise." }, { status: 400 });
  }

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, guest_id, status, amount_total, listing_id, deposit_amount, listings(host_id, title, profiles(stripe_account_id, stripe_onboarding_complete))")
    .eq("id", reservationId)
    .single();

  if (error || !reservation || reservation.guest_id !== user.id) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (reservation.status !== "en_attente") {
    return NextResponse.json({ error: "Cette réservation ne peut plus être payée." }, { status: 409 });
  }
  if (!Number.isInteger(reservation.amount_total) || reservation.amount_total <= 0) {
    return NextResponse.json({ error: "Montant de réservation invalide." }, { status: 422 });
  }

  const host = (reservation as any).listings?.profiles;
  if (!host?.stripe_account_id || !host?.stripe_onboarding_complete) {
    return NextResponse.json(
      { error: "L'hôte n'a pas encore terminé la configuration de ses paiements." },
      { status: 422 }
    );
  }

  const origine = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const avecCaution = !!reservation.deposit_amount;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: reservation.amount_total,
        product_data: { name: (reservation as any).listings?.title ?? "Séjour Escale" },
      },
      quantity: 1,
    }],
    payment_intent_data: {
      transfer_group: `reservation_${reservationId}`,
      metadata: {
        reservation_id: reservationId,
        guest_id: user.id,
        host_stripe_account_id: host.stripe_account_id,
        payment_channel: "card",
      },
      ...(avecCaution ? { setup_future_usage: "off_session" as const } : {}),
    },
    success_url: `${origine}/reservations/${reservationId}?statut=paye`,
    cancel_url: `${origine}/reservations/${reservationId}/paiement?statut=annule`,
  });

  return NextResponse.json({ provider: "stripe", channel: "card", url: session.url });
}
