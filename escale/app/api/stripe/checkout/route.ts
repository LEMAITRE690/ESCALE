// POST /api/stripe/checkout
// Crée le paiement du séjour. Les fonds restent intégralement sur le compte
// Escale jusqu'à la fin du séjour (aucun transfert à ce stade) : c'est le
// job /api/cron/release-payments qui reversera la part de l'hôte après coup,
// une fois la date de fin de séjour passée — cela protège le voyageur en
// cas d'annonce frauduleuse ou de logement non conforme.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, computeFees } from "@/lib/stripe/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { reservationId } = await req.json();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, amount_total, listing_id, deposit_amount, listings(host_id, title, profiles(stripe_account_id, stripe_onboarding_complete))")
    .eq("id", reservationId)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  const host = (reservation as any).listings?.profiles;
  if (!host?.stripe_account_id || !host?.stripe_onboarding_complete) {
    return NextResponse.json(
      { error: "L'hôte n'a pas encore terminé la configuration de ses paiements." },
      { status: 422 }
    );
  }

  const amountTotal = reservation.amount_total; // en centimes
  const avecCaution = !!reservation.deposit_amount;

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
      // Pas de transfer_data ici : les fonds restent sur le compte Escale.
      // On garde une trace du compte hôte pour le virement différé.
      transfer_group: `reservation_${reservationId}`,
      metadata: { reservation_id: reservationId, host_stripe_account_id: host.stripe_account_id },
      // Si une caution est prévue, on mémorise la carte pour pouvoir
      // l'autoriser séparément à l'arrivée (voir /api/deposits/authorize) —
      // le montant de la caution n'est jamais inclus dans ce paiement.
      ...(avecCaution ? { setup_future_usage: "off_session" as const } : {}),
    },
    success_url: `https://escale.app/reservations/${reservationId}?statut=paye`,
    cancel_url: `https://escale.app/reservations/${reservationId}?statut=annule`,
  });

  return NextResponse.json({ url: session.url });
}
