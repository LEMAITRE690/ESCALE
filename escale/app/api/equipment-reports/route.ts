// POST /api/equipment-reports
// Un voyageur ne peut signaler un équipement que sur une réservation qui lui
// appartient et qui est en cours ou déjà passée (pas sur un séjour futur non
// encore commencé).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour signaler un problème." }, { status: 401 });
  }

  const { reservationId, itemName, description, faultAcknowledged } = await req.json();

  if (!reservationId || !itemName?.trim()) {
    return NextResponse.json({ error: "Précisez au moins l'équipement concerné." }, { status: 400 });
  }

  const { data: reservation, error: erreurReservation } = await supabase
    .from("reservations")
    .select("id, listing_id, guest_id, start_date, status")
    .eq("id", reservationId)
    .single();

  if (erreurReservation || !reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (reservation.guest_id !== user.id) {
    return NextResponse.json({ error: "Cette réservation ne vous appartient pas." }, { status: 403 });
  }
  if (new Date(reservation.start_date) > new Date()) {
    return NextResponse.json({ error: "Le séjour n'a pas encore commencé." }, { status: 422 });
  }
  if (!["confirmee", "terminee"].includes(reservation.status)) {
    return NextResponse.json({ error: "Cette réservation n'est pas active." }, { status: 422 });
  }

  const { error: erreurCreation } = await supabase.from("equipment_reports").insert({
    reservation_id: reservationId,
    listing_id: reservation.listing_id,
    guest_id: user.id,
    item_name: itemName.trim(),
    description: description?.trim() || null,
    fault_acknowledged: !!faultAcknowledged,
  });

  if (erreurCreation) {
    return NextResponse.json({ error: "Impossible d'enregistrer le signalement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
