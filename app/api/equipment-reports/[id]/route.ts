// PATCH /api/equipment-reports/:id
// Réservée à l'hôte du logement concerné (vérifié par la RLS, migration 0013).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { status, hostNote } = await req.json();
  const misesAJour: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) misesAJour.status = status;
  if (hostNote !== undefined) misesAJour.host_note = hostNote;

  const { error } = await supabase
    .from("equipment_reports")
    .update(misesAJour)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Impossible de mettre à jour le signalement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
