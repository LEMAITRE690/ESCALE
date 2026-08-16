// POST /api/host/documents — téléverse un document dans le bucket privé
// GET  /api/host/documents — liste les documents de l'hôte connecté

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TYPES_VALIDES = ["piece_identite", "justificatif_domicile", "titre_propriete_ou_mandat", "attestation_assurance"];

export async function POST(req: NextRequest) {
  const authClient = createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const form = await req.formData();
  const documentType = form.get("documentType") as string;
  const listingId = (form.get("listingId") as string) || null;
  const fichier = form.get("file") as File;

  if (!TYPES_VALIDES.includes(documentType)) {
    return NextResponse.json({ error: "Type de document invalide." }, { status: 400 });
  }
  if (!fichier) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (fichier.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (10 Mo maximum)." }, { status: 400 });
  }

  // Si le document concerne une annonce précise (titre de propriété,
  // assurance), on vérifie qu'elle appartient bien à l'hôte appelant.
  if (listingId) {
    const { data: annonce } = await supabaseAdmin
      .from("listings")
      .select("host_id")
      .eq("id", listingId)
      .single();
    if (!annonce || annonce.host_id !== user.id) {
      return NextResponse.json({ error: "Cette annonce ne vous appartient pas." }, { status: 403 });
    }
  }

  const extension = fichier.name.split(".").pop();
  const chemin = `${user.id}/${documentType}-${Date.now()}.${extension}`;

  const { error: erreurUpload } = await supabaseAdmin.storage
    .from("host-documents") // bucket PRIVÉ — à créer manuellement, jamais public
    .upload(chemin, fichier, { contentType: fichier.type, upsert: false });

  if (erreurUpload) {
    return NextResponse.json({ error: "Impossible d'enregistrer le document." }, { status: 500 });
  }

  const { data: document, error: erreurCreation } = await supabaseAdmin
    .from("host_documents")
    .insert({
      host_id: user.id,
      listing_id: listingId,
      document_type: documentType,
      file_path: chemin,
      status: "en_attente",
    })
    .select()
    .single();

  if (erreurCreation) {
    return NextResponse.json({ error: "Impossible d'enregistrer le document." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("host_documents")
    .select("id, document_type, listing_id, status, note_admin, uploaded_at, verified_at")
    .eq("host_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Impossible de charger vos documents." }, { status: 500 });
  }

  return NextResponse.json({ documents: data });
}
