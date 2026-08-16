// POST /api/guest/documents — téléverse un document (pièce d'identité,
//   obligatoire pour la vérification ; ou attestation d'assurance
//   villégiature, recommandée mais facultative)
// GET  /api/guest/documents — liste les documents du voyageur connecté

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TYPES_VALIDES = ["piece_identite", "assurance_villegiature"];

export async function POST(req: NextRequest) {
  const authClient = createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const form = await req.formData();
  const documentType = (form.get("documentType") as string) || "piece_identite";
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

  const extension = fichier.name.split(".").pop();
  const chemin = `${user.id}/${documentType}-${Date.now()}.${extension}`;

  const { error: erreurUpload } = await supabaseAdmin.storage
    .from("guest-documents") // bucket PRIVÉ — à créer manuellement, jamais public
    .upload(chemin, fichier, { contentType: fichier.type, upsert: false });

  if (erreurUpload) {
    return NextResponse.json({ error: "Impossible d'enregistrer le document." }, { status: 500 });
  }

  const { data: document, error: erreurCreation } = await supabaseAdmin
    .from("guest_documents")
    .insert({ guest_id: user.id, document_type: documentType, file_path: chemin, status: "en_attente" })
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
    .from("guest_documents")
    .select("id, document_type, status, note_admin, uploaded_at, verified_at")
    .eq("guest_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Impossible de charger vos documents." }, { status: 500 });
  }

  return NextResponse.json({ documents: data });
}
