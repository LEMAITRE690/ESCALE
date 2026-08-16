// POST /api/admin/disputes/:reservationId
// Réservée au back-office admin. Actions possibles une fois le
// signalement instruit (voir procédure de médiation, CGU Article 7) :
//   - "liberer"          : signalement infondé -> déclenche le virement à l'hôte
//   - "rembourser"       : logement non conforme -> rembourse le voyageur (total ou partiel)
//   - "retenir_caution"  : dommage constaté -> prélève tout ou partie de la caution, reversée à l'hôte
//   - "resoudre"         : clôture sans mouvement d'argent (ex: litige réglé à l'amiable)

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { createClient as createServerAuthClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

async function verifierAdmin() {
  const authClient = createServerAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return false;

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profil?.role === "admin";
}

export async function POST(
  req: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  const { reservationId } = params;

  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }
  const { action, refundAmount, depositAmount, note } = await req.json();

  const { data: paiement, error } = await supabase
    .from("payments")
    .select("id, stripe_payment_intent_id, amount_total, amount_host, host_id, transferred_at, status")
    .eq("reservation_id", reservationId)
    .single();

  if (error || !paiement) {
    return NextResponse.json({ error: "Paiement introuvable pour cette réservation" }, { status: 404 });
  }

  if (action === "liberer") {
    if (paiement.transferred_at) {
      return NextResponse.json({ error: "Les fonds ont déjà été reversés." }, { status: 409 });
    }

    const { data: hote } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", paiement.host_id)
      .single();

    if (!hote?.stripe_account_id || !hote.stripe_onboarding_complete) {
      return NextResponse.json({ error: "Compte de paiement de l'hôte non configuré." }, { status: 422 });
    }

    const transfer = await stripe.transfers.create({
      amount: paiement.amount_host,
      currency: "eur",
      destination: hote.stripe_account_id,
      transfer_group: `reservation_${reservationId}`,
    });

    await supabase
      .from("payments")
      .update({ transferred_at: new Date().toISOString(), stripe_transfer_id: transfer.id })
      .eq("id", paiement.id);

  } else if (action === "rembourser") {
    const montant = refundAmount ?? paiement.amount_total; // en centimes ; total par défaut

    const refund = await stripe.refunds.create({
      payment_intent: paiement.stripe_payment_intent_id,
      amount: montant,
    });

    await supabase
      .from("payments")
      .update({
        status: montant >= paiement.amount_total ? "refunded" : "partially_refunded",
      })
      .eq("id", paiement.id);

    await supabase
      .from("reservations")
      .update({ status: montant >= paiement.amount_total ? "remboursee" : "confirmee" })
      .eq("id", reservationId);

  } else if (action === "retenir_caution") {
    const { data: reservation, error: erreurReservation } = await supabase
      .from("reservations")
      .select("deposit_status, deposit_amount, deposit_payment_intent_id, listings(host_id)")
      .eq("id", reservationId)
      .single();

    if (erreurReservation || !reservation) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }
    if (reservation.deposit_status !== "autorisee") {
      return NextResponse.json({ error: "Aucune caution autorisée pour cette réservation." }, { status: 422 });
    }

    const montantAPrelever = depositAmount
      ? Math.min(depositAmount, reservation.deposit_amount!)
      : reservation.deposit_amount!;

    await stripe.paymentIntents.capture(reservation.deposit_payment_intent_id!, {
      amount_to_capture: montantAPrelever,
    });

    const hostId = (reservation as any).listings?.host_id;
    const { data: hote } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", hostId)
      .single();

    if (hote?.stripe_account_id && hote.stripe_onboarding_complete) {
      await stripe.transfers.create({
        amount: montantAPrelever,
        currency: "eur",
        destination: hote.stripe_account_id,
        transfer_group: `caution_${reservationId}`,
      });
    }

    await supabase
      .from("reservations")
      .update({
        deposit_status: montantAPrelever >= reservation.deposit_amount! ? "prelevee_totale" : "prelevee_partielle",
        deposit_captured_amount: montantAPrelever,
      })
      .eq("id", reservationId);

  } else if (action !== "resoudre") {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  // Dans tous les cas : le litige est clos et le reversement automatique débloqué
  await supabase
    .from("reservations")
    .update({ has_open_dispute: false })
    .eq("id", reservationId);

  await supabase.from("dispute_resolutions").insert({
    reservation_id: reservationId,
    action,
    note: note ?? null,
  });

  return NextResponse.json({ ok: true, action });
}
