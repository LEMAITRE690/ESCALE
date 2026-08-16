// POST /api/listings/:id/photos
// Remplace intégralement les photos d'une annonce existante — utilisée par
// l'écran "Gérer les photos" dans "Mes annonces" (distinct de
// POST /api/listings, qui crée une nouvelle annonce). Réservée à l'hôte
// propriétaire de l'annonce.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data: annonce, error: erreurAnnonce } = await supabaseAdmin
    .from("listings")
    .select("id, host_id, photo_urls")
    .eq("id", params.id)
    .single();

  if (erreurAnnonce || !annonce) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }
  if (annonce.host_id !== user.id) {
    return NextResponse.json({ error: "Cette annonce ne vous appartient pas." }, { status: 403 });
  }

  const form = await req.formData();
  const nouveauxFichiers = form.getAll("photos") as File[];
  // Photos déjà en ligne à conserver (URLs), envoyées par le client pour
  // permettre de réordonner/supprimer sans tout re-téléverser à chaque fois.
  const urlsConservees = JSON.parse((form.get("keepUrls") as string) ?? "[]");

  const urlsFinales: string[] = [...urlsConservees];

  for (let i = 0; i < nouveauxFichiers.length; i++) {
    const fichier = nouveauxFichiers[i];
    const extension = fichier.name.split(".").pop();
    const chemin = `${annonce.id}/${Date.now()}-${i}.${extension}`;

    const { error: erreurUpload } = await supabaseAdmin.storage
      .from("listing-photos")
      .upload(chemin, fichier, { upsert: true, contentType: fichier.type });

    if (erreurUpload) continue; // une photo en erreur ne bloque pas les autres

    const { data: publicUrl } = supabaseAdmin.storage.from("listing-photos").getPublicUrl(chemin);
    urlsFinales.push(publicUrl.publicUrl);
  }

  if (urlsFinales.length === 0) {
    return NextResponse.json({ error: "Au moins une photo est requise." }, { status: 400 });
  }

  const { error: erreurUpdate } = await supabaseAdmin
    .from("listings")
    .update({ photo_urls: urlsFinales, cover_photo_url: urlsFinales[0] })
    .eq("id", annonce.id);

  if (erreurUpdate) {
    return NextResponse.json({ error: "Impossible d'enregistrer les photos." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, photoUrls: urlsFinales });
}
