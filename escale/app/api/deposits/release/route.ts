// POST /api/deposits/release
// Annule l'autorisation bancaire sans rien prélever — cas normal en
// l'absence de dommage constaté. Appelée par le cron de fin de séjour, ou
// manuellement par l'hôte/l'admin depuis la résolution d'un signalement.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { reservationId } = await req.json();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, deposit_status, deposit_payment_intent_id")
    .eq("id", reservationId)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (reservation.deposit_status !== "autorisee") {
    return NextResponse.json({ error: "Aucune autorisation active à libérer." }, { status: 422 });
  }

  await stripe.paymentIntents.cancel(reservation.deposit_payment_intent_id!);

  await supabase
    .from("reservations")
    .update({ deposit_status: "liberee" })
    .eq("id", reservationId);

  return NextResponse.json({ ok: true });
}
