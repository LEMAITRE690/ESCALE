// POST /api/partners/attach
// Un hôte renseigne le code de parrainage de la conciergerie qui l'a
// apporté. Ne peut être fait qu'une seule fois — pas de réattribution
// rétroactive une fois un partenaire déjà rattaché, pour éviter tout
// détournement de rétrocommission après coup.
//
// Ce rattachement accorde aussi automatiquement à la conciergerie le
// statut "super-hôte" (accès de gestion sur TOUTES les annonces de cet
// hôte, présentes et futures — voir migration 0018) : une conciergerie
// gère en général un portefeuille complet, pas une annonce isolée. Cet
// accès reste distinct et révocable indépendamment via
// DELETE /api/partners/grants — la propriété de l'annonce (listings.host_id)
// n'est, elle, jamais affectée, ni par ce rattachement ni par sa révocation.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code?.trim()) {
    return NextResponse.json({ error: "Code de parrainage manquant." }, { status: 400 });
  }

  const { data: profil } = await supabase
    .from("profiles")
    .select("referred_by_partner_id")
    .eq("id", user.id)
    .single();

  if (profil?.referred_by_partner_id) {
    return NextResponse.json({ error: "Un partenaire est déjà rattaché à votre compte." }, { status: 409 });
  }

  const { data: partenaire, error: erreurPartenaire } = await supabase
    .from("partners")
    .select("id, name")
    .eq("referral_code", code.trim().toUpperCase())
    .eq("status", "actif")
    .single();

  if (erreurPartenaire || !partenaire) {
    return NextResponse.json({ error: "Code de parrainage invalide." }, { status: 404 });
  }

  await supabase
    .from("profiles")
    .update({ referred_by_partner_id: partenaire.id })
    .eq("id", user.id);

  // Accès "super-hôte" automatique, mais distinct : un hôte pourrait à
  // l'avenir se voir proposer de le refuser sans perdre le rattachement
  // financier — cette version le crée systématiquement pour rester simple.
  await supabase
    .from("partner_host_grants")
    .upsert(
      { partner_id: partenaire.id, host_id: user.id, status: "actif" },
      { onConflict: "partner_id,host_id" }
    );

  return NextResponse.json({ ok: true, partnerName: partenaire.name });
}
