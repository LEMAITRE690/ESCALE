// GET  /api/admin/legal-documents — versions publiées, tous types confondus.
// POST /api/admin/legal-documents — publie une nouvelle version.
//
// Publier plutôt que corriger : une version déjà acceptée est figée en base
// par un trigger. Une correction de texte passe donc par une nouvelle version,
// que les utilisateurs devront réaccepter.

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifierAdmin } from "@/lib/admin/auth";

// 'cgu' est volontairement absent : les CGU sont rendues par app/cgu/page.jsx,
// qui compose ses taux depuis lib/pricing.json. Publier une version en base
// ferait diverger les deux sans que rien ne le signale (voir migration 0031).
const TYPES = ["cgv_hotes", "cgl"] as const;

export async function GET() {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { data } = await supabaseAdmin
    .from("legal_documents")
    .select("id, type, version, title, effective_from, published_at, content_hash")
    .order("type")
    .order("effective_from", { ascending: false });

  // Nombre d'acceptations par version, pour mesurer l'effet d'une publication.
  const { data: acceptations } = await supabaseAdmin
    .from("legal_acceptances")
    .select("document_id");

  const compte = new Map<string, number>();
  for (const a of acceptations ?? []) {
    compte.set(a.document_id, (compte.get(a.document_id) ?? 0) + 1);
  }

  return NextResponse.json({
    documents: (data ?? []).map((d) => ({ ...d, acceptations: compte.get(d.id) ?? 0 })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { type, version, title, content, effectiveFrom } = await req.json();

  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "Type de document inconnu." }, { status: 400 });
  }
  if (!version?.trim() || !title?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "Version, titre et texte sont requis." },
      { status: 400 }
    );
  }

  const texte = content.trim();

  const { data, error } = await supabaseAdmin
    .from("legal_documents")
    .insert({
      type,
      version: version.trim(),
      title: title.trim(),
      content: texte,
      // Empreinte du texte publié : permet de prouver plus tard que le texte
      // servi est bien celui qui a été accepté.
      content_hash: createHash("sha256").update(texte, "utf8").digest("hex"),
      effective_from: effectiveFrom || new Date().toISOString(),
    })
    .select("id, type, version, effective_from")
    .single();

  if (error) {
    const message =
      error.code === "23505"
        ? "Cette version existe déjà pour ce type de document."
        : "Publication impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ document: data });
}
