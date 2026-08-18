// POST /api/stripe/checkout
// Paiement carte de secours. Le parcours principal pourra être assuré par
// Pay by Bank via un PSP marketplace. Cette route ne doit jamais permettre
// à un utilisateur de payer la réservation d'un autre voyageur.

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

  // Même réponse si la réservation n'existe pas ou appartient à quelqu'un
  // d'autre : on n'expose pas les identifiants de réservation.
  if (error || !reservation || reservation.guest_id !== user.id) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  if (reservation.status !== "en_attente") {
    return NextResponse.json(
      { error: "Cette réservation ne peut plus être payée dans son état actuel." },
      { status: 409 }
    );
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

  const amountTotal = reservation.amount_total;
  const avecCaution = !!reservation.deposit_amount;
  const origine = process.env.NEXT_PUBLIC_SITE_URL || "https://escale.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: amountTotal,
          product_data: { name: (reservation as any).listings?.title ?? "Séjour Escale" },
        },
        quantity: 1,
      },
    ],
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
    cancel_url: `${origine}/reservations/${reservationId}?statut=annule`,
  });

  return NextResponse.json({ url: session.url });
}
