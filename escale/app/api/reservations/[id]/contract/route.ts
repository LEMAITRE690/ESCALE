// GET /api/reservations/:id/contract
// Génère à la volée un contrat de location individualisé pour cette
// réservation précise — les clauses (équipements, règlement intérieur,
// annulation, caution) varient automatiquement d'un logement à l'autre,
// puisqu'elles sont lues directement depuis les données réelles de
// l'annonce concernée. Accessible au voyageur ou à l'hôte de la réservation.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { genererContratPDF } from "@/lib/contracts/generateContract";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(`
      id, start_date, end_date, guests, amount_total, with_pet, guest_id,
      listings (
        title, type, city, address, description, guests, bedrooms, bathrooms,
        amenities, house_rules, checkin_time, checkout_time, cancellation_policy,
        security_deposit, pets_allowed, pets_fee, cleaning_fee, host_id,
        profiles ( full_name )
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  const logement = (reservation as any).listings;
  const estVoyageur = reservation.guest_id === user.id;
  const estHote = logement?.host_id === user.id;

  if (!estVoyageur && !estHote) {
    return NextResponse.json({ error: "Accès non autorisé à ce contrat." }, { status: 403 });
  }

  // Prénom du voyageur uniquement (jamais le nom complet), cohérent avec le
  // reste de l'application (export iCal, avis...).
  const { data: profilVoyageur } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", reservation.guest_id)
    .single();
  const voyageurPrenom = (profilVoyageur?.full_name ?? "Voyageur").trim().split(/\s+/)[0];

  // Statut de vérification d'identité de l'hôte (vue calculée, jamais le
  // contenu des documents eux-mêmes — voir migration 0021).
  const { data: verification } = await supabase
    .from("host_verification_status")
    .select("identite_verifiee")
    .eq("host_id", logement?.host_id)
    .maybeSingle();

  // Idem côté voyageur (migration 0022).
  const { data: verificationVoyageur } = await supabase
    .from("guest_verification_status")
    .select("identite_verifiee")
    .eq("guest_id", reservation.guest_id)
    .maybeSingle();

  const pdf = await genererContratPDF({
    reservationId: reservation.id,
    hoteNom: logement?.profiles?.full_name ?? "Hôte Escale",
    identiteHoteVerifiee: !!verification?.identite_verifiee,
    voyageurPrenom,
    identiteVoyageurVerifiee: !!verificationVoyageur?.identite_verifiee,
    logement: {
      titre: logement?.title ?? "",
      type: logement?.type ?? null,
      ville: logement?.city ?? null,
      adresse: logement?.address ?? null,
      description: logement?.description ?? null,
      guests: logement?.guests ?? 1,
      bedrooms: logement?.bedrooms ?? 0,
      bathrooms: logement?.bathrooms ?? 0,
      amenities: Array.isArray(logement?.amenities) ? logement.amenities : [],
      houseRules: logement?.house_rules ?? null,
      checkinTime: logement?.checkin_time ?? null,
      checkoutTime: logement?.checkout_time ?? null,
      cancellationPolicy: logement?.cancellation_policy ?? "moderee",
      securityDeposit: logement?.security_deposit ?? null,
      petsAllowed: !!logement?.pets_allowed,
      petsFee: logement?.pets_fee ?? null,
      cleaningFee: logement?.cleaning_fee ?? null,
    },
    sejour: {
      startDate: reservation.start_date,
      endDate: reservation.end_date,
      guests: reservation.guests,
      amountTotal: reservation.amount_total,
      withPet: !!reservation.with_pet,
    },
  });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contrat-escale-${reservation.id}.pdf"`,
    },
  });
}
