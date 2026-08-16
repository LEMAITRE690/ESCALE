// POST /api/listings
// Reçoit les données du formulaire de publication (multipart/form-data) :
// champs texte + fichiers photos. Upload les photos vers le bucket Supabase
// Storage "listing-photos", puis crée l'annonce en base avec les URLs.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { createClient as createServerAuthClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // L'hôte est déterminé par la session authentifiée, jamais par un champ
  // envoyé par le client — sans quoi n'importe qui pourrait publier une
  // annonce au nom d'un autre utilisateur.
  const authClient = createServerAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour publier une annonce." }, { status: 401 });
  }
  const hostId = user.id;

  const form = await req.formData();

  const titre = form.get("titre") as string;
  const assuranceConfirmee = form.get("assuranceConfirmee") === "true";

  if (!titre?.trim()) {
    return NextResponse.json({ error: "Le titre de l'annonce est requis" }, { status: 400 });
  }
  if (!assuranceConfirmee) {
    return NextResponse.json(
      { error: "La vérification de l'assurance doit être confirmée avant publication" },
      { status: 422 }
    );
  }

  const fichiers = form.getAll("photos") as File[];
  if (fichiers.length === 0) {
    return NextResponse.json({ error: "Au moins une photo est requise" }, { status: 400 });
  }

  // 1. Créer l'annonce en base (sans les photos) pour obtenir un id
  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      host_id: hostId,
      title: titre,
      type: form.get("type"),
      description: form.get("description"),
      guests: Number(form.get("voyageurs") ?? 1),
      bedrooms: Number(form.get("chambres") ?? 0),
      bathrooms: Number(form.get("sallesDeBain") ?? 0),
      address: form.get("adresse"),
      city: form.get("ville"),
      postal_code: form.get("codePostal"),
      address_details: form.get("complement"), // visible uniquement après réservation confirmée
      price_per_night: Number(form.get("prix") ?? 0),
      amenities: JSON.parse((form.get("equipements") as string) ?? "[]"),
      extra_amenities: JSON.parse((form.get("equipementsAutres") as string) ?? "[]"),
      tourist_tax_enabled: form.get("taxeSejourActive") === "true",
      tourist_tax_per_person_per_night: form.get("taxeSejourActive") === "true" && form.get("taxeSejourMontant")
        ? Number(form.get("taxeSejourMontant"))
        : null,
      pets_allowed: form.get("animauxAcceptes") === "true",
      pets_fee: form.get("fraisAnimaux") ? Number(form.get("fraisAnimaux")) : null,
      cleaning_fee: form.get("menagePayant") === "true" && form.get("fraisMenage")
        ? Number(form.get("fraisMenage"))
        : null,
      checkin_time: form.get("heureArriveeStandard") || null,
      checkout_time: form.get("heureDepartStandard") || null,
      house_rules: form.get("reglementInterieur") || null,
      late_checkout_available: form.get("departTardif") === "true",
      late_checkout_time: form.get("departTardif") === "true" ? form.get("heureDepartTardif") : null,
      late_checkout_fee: form.get("fraisDepartTardif") ? Number(form.get("fraisDepartTardif")) : null,
      min_stay_nights: form.get("sejourMin") ? Number(form.get("sejourMin")) : null,
      max_stay_nights: form.get("sejourMax") ? Number(form.get("sejourMax")) : null,
      instant_booking: form.get("reservationInstantanee") === "true",
      early_checkin_available: form.get("arriveeAnticipee") === "true",
      early_checkin_time: form.get("arriveeAnticipee") === "true" ? form.get("heureArriveeAnticipee") : null,
      early_checkin_fee: form.get("fraisArriveeAnticipee") ? Number(form.get("fraisArriveeAnticipee")) : null,
      children_welcome: form.get("enfantsBienvenus") === "true",
      crib_available: form.get("equipementLitParapluie") === "true",
      high_chair_available: form.get("equipementChaiseHaute") === "true",
      smoking_allowed: form.get("fumeursAcceptes") === "true",
      events_allowed: form.get("evenementsAutorises") === "true",
      cancellation_policy: form.get("politiqueAnnulation") ?? "moderee",
      security_deposit: form.get("caution") ? Number(form.get("caution")) : null,
      insurance_confirmed: true,
      status: "en_moderation",
    })
    .select("id")
    .single();

  if (insertError || !listing) {
    return NextResponse.json({ error: "Impossible de créer l'annonce" }, { status: 500 });
  }

  // 2. Upload de chaque photo dans le bucket, nommée par ordre d'affichage
  const urls: string[] = [];
  for (let i = 0; i < fichiers.length; i++) {
    const fichier = fichiers[i];
    const extension = fichier.name.split(".").pop();
    const chemin = `${listing.id}/${String(i).padStart(2, "0")}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-photos")
      .upload(chemin, fichier, { upsert: true, contentType: fichier.type });

    if (uploadError) continue; // on n'échoue pas toute la publication pour une photo en erreur

    const { data: publicUrl } = supabase.storage.from("listing-photos").getPublicUrl(chemin);
    urls.push(publicUrl.publicUrl);
  }

  // 3. Enregistrer les URLs des photos sur l'annonce (première = couverture)
  await supabase
    .from("listings")
    .update({ photo_urls: urls, cover_photo_url: urls[0] ?? null })
    .eq("id", listing.id);

  return NextResponse.json({ id: listing.id, photoCount: urls.length });
}
