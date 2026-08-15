// PATCH /api/admin/tourist-tax/:id — marque une ligne comme reversée
// (le virement lui-même se fait hors de l'application, cette route
// enregistre seulement qu'il a été effectué).

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { note } = await req.json().catch(() => ({ note: undefined }));

  const { error } = await supabaseAdmin
    .from("tourist_tax_remittances")
    .update({ status: "verse", remitted_at: new Date().toISOString(), note: note ?? null })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Impossible de mettre à jour ce reversement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
