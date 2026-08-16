// GET /api/legal/documents/:type — version en vigueur d'un document juridique.
//
// Publique : ces textes doivent être consultables en intégralité avant toute
// acceptation, sans compte ni détour. Renvoie aussi, pour un utilisateur
// connecté, la version qu'il a déjà acceptée.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TYPES = ["cgu", "cgv_hotes", "cgl"] as const;

export async function GET(_req: NextRequest, { params }: { params: { type: string } }) {
  if (!TYPES.includes(params.type as any)) {
    return NextResponse.json({ error: "Type de document inconnu." }, { status: 404 });
  }

  const { data: document } = await supabaseAdmin
    .from("legal_documents_en_vigueur")
    .select("id, type, version, title, content, content_hash, effective_from")
    .eq("type", params.type)
    .maybeSingle();

  if (!document) {
    return NextResponse.json(
      { error: "Aucune version de ce document n'est en vigueur." },
      { status: 404 }
    );
  }

  // Acceptation de l'utilisateur connecté, s'il y en a un.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let acceptation = null;
  if (user) {
    const { data } = await supabaseAdmin
      .from("legal_acceptances")
      .select("document_id, accepted_at, legal_documents!inner(version)")
      .eq("user_id", user.id)
      .eq("document_type", params.type)
      .is("reservation_id", null)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      acceptation = {
        version: (data as any).legal_documents?.version ?? null,
        acceptedAt: data.accepted_at,
        aJour: data.document_id === document.id,
      };
    }
  }

  return NextResponse.json({ document, acceptation });
}
