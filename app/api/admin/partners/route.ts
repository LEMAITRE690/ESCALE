// GET /api/admin/partners — liste les conciergeries et l'état de leur fiche légale.
//
// Réservé aux administrateurs Escale : la saisie de l'identité légale d'une
// conciergerie ne lui est pas déléguée.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifierAdmin } from "@/lib/admin/auth";

export async function GET() {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { data: partenaires, error } = await supabaseAdmin
    .from("partners")
    .select(
      `id, name, email, referral_code, status, created_at,
       legal_name, legal_form, siret, rcs, share_capital, registered_address,
       vat_regime, vat_number,
       legal_rep_name, legal_rep_role, legal_rep_email, legal_rep_phone`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Lecture des conciergeries impossible." }, { status: 500 });
  }

  // Complétude calculée par la base (partner_legal_status), pour que la règle
  // reste unique : c'est la même qui conditionne l'octroi du statut super-hôte.
  const { data: etats } = await supabaseAdmin
    .from("partner_legal_status")
    .select("partner_id, fiche_complete, hotes_actifs");

  const parId = new Map((etats ?? []).map((e: any) => [e.partner_id, e]));

  return NextResponse.json({
    partenaires: (partenaires ?? []).map((p: any) => ({
      ...p,
      ficheComplete: parId.get(p.id)?.fiche_complete ?? false,
      hotesActifs: parId.get(p.id)?.hotes_actifs ?? 0,
    })),
  });
}
