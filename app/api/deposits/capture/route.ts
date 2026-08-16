// POST /api/deposits/capture
// Réservée à l'admin (à appeler depuis la résolution d'un signalement ou
// d'un litige — voir app/api/admin/disputes). Prélève tout ou partie du
// montant autorisé, puis reverse la somme prélevée à l'hôte (la caution
// n'est jamais soumise à la commission plateforme, contrairement au
// paiement du séjour).

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { createClient as createServerAuthClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

async function verifierAdmin() {
  const authClient = createServerAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return false;

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profil?.role === "admin";
}

export async function POST(req: NextRequest) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { reservationId, amount } = await req.json(); // amount en centimes, optionnel (défaut : montant total)

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, deposit_status, deposit_amount, deposit_payment_intent_id, listings(host_id)")
    .eq("id", reservationId)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (reservation.deposit_status !== "autorisee") {
    return NextResponse.json({ error: "Aucune caution autorisée pour cette réservation." }, { status: 422 });
  }

  const montantAPrelever = amount ? Math.min(amount, reservation.deposit_amount!) : reservation.deposit_amount!;

  const intent = await stripe.paymentIntents.capture(reservation.deposit_payment_intent_id!, {
    amount_to_capture: montantAPrelever,
  });

  const hostId = (reservation as any).listings?.host_id;
  const { data: hote } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", hostId)
    .single();

  let transfertId: string | null = null;
  if (hote?.stripe_account_id && hote.stripe_onboarding_complete) {
    const transfer = await stripe.transfers.create({
      amount: montantAPrelever,
      currency: "eur",
      destination: hote.stripe_account_id,
      transfer_group: `caution_${reservationId}`,
    });
    transfertId = transfer.id;
  }

  await supabase
    .from("reservations")
    .update({
      deposit_status: montantAPrelever >= reservation.deposit_amount! ? "prelevee_totale" : "prelevee_partielle",
      deposit_captured_amount: montantAPrelever,
    })
    .eq("id", reservationId);

  return NextResponse.json({ ok: true, captured: montantAPrelever, transferId: transfertId, paymentIntentStatus: intent.status });
}
