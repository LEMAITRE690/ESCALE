// GET /api/admin/guest-documents/:id — URL signée temporaire pour consultation
// PATCH /api/admin/guest-documents/:id — valide ou refuse le document

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerAuthClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifierAdmin() {
  const authClient = createServerAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return false;
  const { data: profil } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
  return profil?.role === "admin";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { data: document, error } = await supabaseAdmin
    .from("guest_documents")
    .select("file_path")
    .eq("id", params.id)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  const { data: urlSignee, error: erreurUrl } = await supabaseAdmin.storage
    .from("guest-documents")
    .createSignedUrl(document.file_path, 300); // 5 minutes, jamais de lien permanent

  if (erreurUrl || !urlSignee) {
    return NextResponse.json({ error: "Impossible de générer le lien de consultation." }, { status: 500 });
  }

  return NextResponse.json({ url: urlSignee.signedUrl });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const authClient = createServerAuthClient();
  const { data: { user } } = await authClient.auth.getUser();

  const { status, noteAdmin } = await req.json();
  if (!["valide", "refuse"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("guest_documents")
    .update({
      status,
      note_admin: status === "refuse" ? (noteAdmin ?? "Document refusé.") : null,
      verified_at: new Date().toISOString(),
      verified_by: user!.id,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Impossible de mettre à jour le document." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
