// POST /api/partners
// Crée une conciergerie partenaire avec un code de parrainage unique.
// Étape purement administrative : la mise en relation ne se fait pas via
// une inscription libre (contrairement à un compte hôte/voyageur), mais
// via un accord commercial — à réserver à un usage interne/admin.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function genererCodeParrainage(nom: string) {
  const base = nom.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "CONCIERGE";
  const suffixe = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffixe}`;
}

async function verifierAdmin() {
  const authClient = createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return false;
  const { data: profil } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
  return profil?.role === "admin";
}

export async function POST(req: NextRequest) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { name, email } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nom et e-mail requis." }, { status: 400 });
  }

  let referralCode = genererCodeParrainage(name);

  // Évite une collision improbable sur le code généré
  for (let i = 0; i < 5; i++) {
    const { data: existant } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!existant) break;
    referralCode = genererCodeParrainage(name);
  }

  const { data: partenaire, error } = await supabaseAdmin
    .from("partners")
    .insert({ name: name.trim(), email: email.trim(), referral_code: referralCode })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Impossible de créer le partenaire." }, { status: 500 });
  }

  return NextResponse.json({ partner: partenaire });
}
