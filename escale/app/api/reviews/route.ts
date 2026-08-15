// POST /api/reviews
// Un voyageur ne peut noter que : (1) une réservation qui lui appartient,
// (2) dont le séjour est terminé, (3) qu'il n'a pas déjà notée.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour laisser un avis." }, { status: 401 });
  }

  const { reservationId, rating, comment } = await req.json();

  if (!reservationId || !rating) {
    return NextResponse.json({ error: "Une note est requise." }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "La note doit être comprise entre 1 et 5." }, { status: 400 });
  }

  const { data: reservation, error: erreurReservation } = await supabase
    .from("reservations")
    .select("id, listing_id, guest_id, end_date, status")
    .eq("id", reservationId)
    .single();

  if (erreurReservation || !reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (reservation.guest_id !== user.id) {
    return NextResponse.json({ error: "Cette réservation ne vous appartient pas." }, { status: 403 });
  }

  const sejourTermine = reservation.status === "terminee" || new Date(reservation.end_date) < new Date();
  if (!sejourTermine) {
    return NextResponse.json({ error: "Vous pourrez laisser un avis une fois le séjour terminé." }, { status: 422 });
  }

  const { data: avisExistant } = await supabase
    .from("reviews")
    .select("id")
    .eq("reservation_id", reservationId)
    .maybeSingle();

  if (avisExistant) {
    return NextResponse.json({ error: "Vous avez déjà laissé un avis pour ce séjour." }, { status: 409 });
  }

  const { data: profil } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // "Julien M." — jamais le nom complet, cohérent avec le reste de l'app
  const parties = (profil?.full_name ?? "Voyageur").trim().split(/\s+/);
  const nomAffiche = parties.length > 1
    ? `${parties[0]} ${parties[parties.length - 1].charAt(0)}.`
    : parties[0];

  const { error: erreurCreation } = await supabase.from("reviews").insert({
    listing_id: reservation.listing_id,
    reservation_id: reservationId,
    guest_id: user.id,
    guest_display_name: nomAffiche,
    rating,
    comment: comment?.trim() || null,
  });

  if (erreurCreation) {
    return NextResponse.json({ error: "Impossible d'enregistrer l'avis." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
