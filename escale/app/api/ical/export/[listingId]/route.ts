// GET /api/ical/export/:listingId  -> fichier .ics à coller dans Airbnb
//
// Ce lien doit être PUBLIC (pas d'authentification) : Airbnb doit pouvoir
// l'interroger tout seul, toutes les 1 à 3 heures, sans session ouverte.
// Ne rien exposer de sensible dans SUMMARY (pas de nom complet, pas d'email).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateIcalForListing } from "@/lib/ical/generate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // lecture serveur uniquement
);

export async function GET(
  req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  const { listingId } = params;

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
  }

  const { data: reservations, error: resError } = await supabase
    .from("reservations")
    .select("id, start_date, end_date, guest_first_name, status")
    .eq("listing_id", listingId)
    .in("status", ["confirmee", "en_attente"]);

  if (resError) {
    return NextResponse.json({ error: "Erreur de lecture des réservations" }, { status: 500 });
  }

  const ics = generateIcalForListing(
    listing.id,
    listing.title,
    (reservations ?? []).map((r) => ({
      id: r.id,
      startDate: r.start_date,
      endDate: r.end_date,
      guestName: r.guest_first_name, // prénom seul, jamais le nom complet
    }))
  );

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="escale-${listingId}.ics"`,
      "Cache-Control": "public, max-age=1800", // 30 min, cohérent avec le rythme iCal
    },
  });
}
