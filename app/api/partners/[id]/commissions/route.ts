// GET /api/partners/:id/commissions
// Renvoie le résumé automatique (vue partner_commission_summary) et le
// détail des paiements pour une conciergerie donnée. Accessible par la
// conciergerie elle-même (via son compte de connexion) ou par un admin.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerAuthClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createServerAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data: partenaire } = await supabaseAdmin
    .from("partners")
    .select("id, owner_user_id")
    .eq("id", params.id)
    .single();

  const { data: profil } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
  const estAdmin = profil?.role === "admin";
  const estLePartenaire = partenaire?.owner_user_id === user.id;

  if (!estAdmin && !estLePartenaire) {
    return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
  }

  const { data: resume, error: erreurResume } = await supabaseAdmin
    .from("partner_commission_summary")
    .select("*")
    .eq("partner_id", params.id)
    .maybeSingle();

  if (erreurResume) {
    return NextResponse.json({ error: "Impossible de charger les commissions." }, { status: 500 });
  }

  const { data: paiements } = await supabaseAdmin
    .from("payments")
    .select("id, reservation_id, partner_fee, partner_transferred_at, created_at")
    .eq("partner_id", params.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    resume: resume ?? { partner_id: params.id, reservation_count: 0, total_earned: 0, total_transferred: 0, total_pending: 0 },
    paiements: paiements ?? [],
  });
}
