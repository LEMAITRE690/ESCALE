// PATCH /api/reviews/:id/reply
// Réservée à l'hôte du logement concerné (vérifié par la RLS + le trigger
// prevent_review_content_edit_by_host, voir migration 0012).

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

  const { reply } = await req.json();
  if (!reply?.trim()) {
    return NextResponse.json({ error: "La réponse ne peut pas être vide." }, { status: 400 });
  }

  const { error } = await supabase
    .from("reviews")
    .update({ host_reply: reply.trim(), host_reply_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Impossible d'enregistrer la réponse." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
