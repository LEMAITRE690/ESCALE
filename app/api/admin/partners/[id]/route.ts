// PATCH /api/admin/partners/:id — met à jour la fiche légale d'une conciergerie.
//
// Ces informations servent à établir le contrat d'apporteur d'affaires et
// conditionnent l'octroi du statut super-hôte (voir migration 0030).

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifierAdmin } from "@/lib/admin/auth";

// Liste blanche : une requête ne peut pas modifier le code de parrainage, le
// compte Stripe ou le statut du partenaire par cette route.
const CHAMPS_MODIFIABLES = [
  "name",
  "email",
  "legal_name",
  "legal_form",
  "siret",
  "rcs",
  "share_capital",
  "registered_address",
  "vat_regime",
  "vat_number",
  "legal_rep_name",
  "legal_rep_role",
  "legal_rep_email",
  "legal_rep_phone",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const corps = await req.json();
  const maj: Record<string, unknown> = {};

  for (const champ of CHAMPS_MODIFIABLES) {
    if (champ in corps) {
      const valeur = corps[champ];
      // Une chaîne vide vaut « non renseigné » : on stocke null pour que le
      // test de complétude en base reste simple.
      maj[champ] =
        typeof valeur === "string" ? (valeur.trim() === "" ? null : valeur.trim()) : valeur;
    }
  }

  if (Object.keys(maj).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
  }

  if (maj.vat_regime && !["assujettie", "franchise_en_base"].includes(maj.vat_regime as string)) {
    return NextResponse.json({ error: "Régime de TVA invalide." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("partners").update(maj).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: etat } = await supabaseAdmin
    .from("partner_legal_status")
    .select("fiche_complete, hotes_actifs")
    .eq("partner_id", params.id)
    .maybeSingle();

  return NextResponse.json({
    ficheComplete: etat?.fiche_complete ?? false,
    hotesActifs: etat?.hotes_actifs ?? 0,
  });
}
