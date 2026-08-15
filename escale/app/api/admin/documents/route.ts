// GET /api/admin/documents — liste les documents hôte, réservé aux admins.
// Filtre par défaut sur "en_attente" (?status=tous pour tout voir).

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

export async function GET(req: NextRequest) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const statut = req.nextUrl.searchParams.get("status") ?? "en_attente";

  let requete = supabaseAdmin
    .from("host_documents")
    .select("id, host_id, document_type, status, uploaded_at, note_admin, profiles ( full_name, email )")
    .order("uploaded_at", { ascending: true });

  if (statut !== "tous") requete = requete.eq("status", statut);

  const { data, error } = await requete;
  if (error) {
    return NextResponse.json({ error: "Impossible de charger les documents." }, { status: 500 });
  }

  return NextResponse.json({ documents: data });
}
