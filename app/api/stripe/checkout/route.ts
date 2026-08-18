// Compatibilité avec l'ancien parcours de réservation.
// Au lieu d'envoyer directement le voyageur vers Stripe, cette route renvoie
// désormais l'écran ESCALE de choix du moyen de paiement. Une fois tous les
// appels migrés, elle pourra être supprimée.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

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

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, guest_id, status")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation || reservation.guest_id !== user.id) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (reservation.status !== "en_attente") {
    return NextResponse.json({ error: "Cette réservation ne peut plus être payée." }, { status: 409 });
  }

  return NextResponse.json({
    provider: "escale",
    channel: "choice",
    url: `/reservations/${reservationId}/paiement`,
  });
}
