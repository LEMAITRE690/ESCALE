// POST /api/reservations
// Crée une réservation en statut "en_attente" avant paiement. Le montant est
// systématiquement recalculé côté serveur à partir du logement en base —
// jamais fait confiance à un montant envoyé par le client.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour réserver." }, { status: 401 });
  }

  const { listingId, startDate, endDate, guests, avecAnimal, voyageursExoneres } = await req.json();

  if (!listingId || !startDate || !endDate) {
    return NextResponse.json({ error: "Dates de séjour manquantes." }, { status: 400 });
  }

  const nuits = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000);
  if (nuits <= 0) {
    return NextResponse.json({ error: "La date de départ doit être après la date d'arrivée." }, { status: 400 });
  }

  const { data: logement, error: erreurLogement } = await supabase
    .from("listings")
    .select("id, price_per_night, cleaning_fee, pets_fee, pets_allowed, guests, min_stay_nights, max_stay_nights, status, security_deposit, tourist_tax_enabled, tourist_tax_per_person_per_night")
    .eq("id", listingId)
    .eq("status", "actif")
    .single();

  if (erreurLogement || !logement) {
    return NextResponse.json({ error: "Logement introuvable ou indisponible." }, { status: 404 });
  }

  if (guests && guests > logement.guests) {
    return NextResponse.json({ error: `Ce logement accueille au maximum ${logement.guests} voyageurs.` }, { status: 422 });
  }
  if (logement.min_stay_nights && nuits < logement.min_stay_nights) {
    return NextResponse.json({ error: `Séjour minimum : ${logement.min_stay_nights} nuits.` }, { status: 422 });
  }
  if (logement.max_stay_nights && nuits > logement.max_stay_nights) {
    return NextResponse.json({ error: `Séjour maximum : ${logement.max_stay_nights} nuits.` }, { status: 422 });
  }

  // Vérifie l'absence de chevauchement avec une réservation déjà confirmée/en attente
  const { data: conflits } = await supabase
    .from("reservations")
    .select("id")
    .eq("listing_id", listingId)
    .in("status", ["confirmee", "en_attente"])
    .lt("start_date", endDate)
    .gt("end_date", startDate);

  if (conflits && conflits.length > 0) {
    return NextResponse.json({ error: "Ces dates ne sont plus disponibles." }, { status: 409 });
  }

  const sousTotal = nuits * Number(logement.price_per_night);
  const fraisMenage = Number(logement.cleaning_fee ?? 0);
  const fraisAnimaux = avecAnimal && logement.pets_allowed ? Number(logement.pets_fee ?? 0) : 0;

  // Taxe de séjour : collectée pour le compte de la commune, jamais soumise
  // à la commission Escale (voir lib/stripe/client.ts). Le nombre de
  // voyageurs exonérés (moins de 18 ans) est déclaré par le voyageur lui-même
  // à la réservation — non vérifié par Escale, sous sa responsabilité.
  const nbVoyageurs = guests ?? 1;
  const nbExoneres = Math.min(Number(voyageursExoneres ?? 0), nbVoyageurs);
  const nbVoyageursTaxables = nbVoyageurs - nbExoneres;
  const tauxTaxeSejour = logement.tourist_tax_enabled ? Number(logement.tourist_tax_per_person_per_night ?? 0) : 0;
  const taxeSejourEuros = tauxTaxeSejour * nbVoyageursTaxables * nuits;

  const montantTotalEuros = sousTotal + fraisMenage + fraisAnimaux + taxeSejourEuros;
  const montantTotalCentimes = Math.round(montantTotalEuros * 100);
  const taxeSejourCentimes = Math.round(taxeSejourEuros * 100);

  const { data: profil } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: reservation, error: erreurCreation } = await supabase
    .from("reservations")
    .insert({
      listing_id: listingId,
      guest_id: user.id,
      guest_first_name: (profil?.full_name ?? "").split(" ")[0] || null,
      start_date: startDate,
      end_date: endDate,
      guests: guests ?? 1,
      with_pet: !!avecAnimal,
      amount_total: montantTotalCentimes,
      tourist_tax_amount: taxeSejourCentimes || null,
      tourist_tax_exempt_guests: nbExoneres,
      status: "en_attente",
      deposit_amount: logement.security_deposit ? Math.round(Number(logement.security_deposit) * 100) : null,
      // deposit_status reste "aucune" par défaut ; il passe à "carte_enregistree"
      // une fois le paiement principal confirmé (voir le webhook Stripe), pas avant.
    })
    .select("id")
    .single();

  if (erreurCreation || !reservation) {
    return NextResponse.json({ error: "Impossible de créer la réservation." }, { status: 500 });
  }

  return NextResponse.json({ reservationId: reservation.id, amountTotal: montantTotalCentimes, touristTaxAmount: taxeSejourCentimes });
}
