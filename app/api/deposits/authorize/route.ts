// POST /api/deposits/authorize
// Déclenchée automatiquement à la date d'arrivée (voir le cron associé),
// ou manuellement par l'hôte. Bloque le montant de la caution sur la carte
// du voyageur SANS le prélever (capture_method: "manual").
//
// Limite technique importante : une autorisation bancaire par carte est
// généralement valable 7 jours (parfois moins selon la banque émettrice).
// Pour un séjour plus long, ce cron doit être relancé périodiquement pour
// renouveler l'autorisation — non géré automatiquement dans cette version.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const { reservationId } = await req.json();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, deposit_amount, deposit_status, deposit_customer_id, deposit_payment_method_id")
    .eq("id", reservationId)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (!reservation.deposit_amount) {
    return NextResponse.json({ error: "Aucune caution prévue pour cette réservation." }, { status: 422 });
  }
  if (!reservation.deposit_customer_id || !reservation.deposit_payment_method_id) {
    return NextResponse.json({ error: "Aucun moyen de paiement enregistré pour la caution." }, { status: 422 });
  }
  if (reservation.deposit_status === "autorisee") {
    return NextResponse.json({ error: "La caution est déjà autorisée." }, { status: 409 });
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: reservation.deposit_amount,
      currency: "eur",
      customer: reservation.deposit_customer_id,
      payment_method: reservation.deposit_payment_method_id,
      capture_method: "manual", // autorise sans prélever
      off_session: true,
      confirm: true,
      metadata: { reservation_id: reservationId, type: "caution" },
    });

    await supabase
      .from("reservations")
      .update({
        deposit_payment_intent_id: intent.id,
        deposit_status: "autorisee",
        deposit_authorized_at: new Date().toISOString(),
      })
      .eq("id", reservationId);

    return NextResponse.json({ ok: true, status: intent.status });
  } catch (err: any) {
    await supabase
      .from("reservations")
      .update({ deposit_status: "echec" })
      .eq("id", reservationId);

    return NextResponse.json(
      { error: `Autorisation refusée : ${err?.message ?? "carte invalide ou expirée"}` },
      { status: 402 }
    );
  }
}
