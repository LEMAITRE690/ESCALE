// GET /api/admin/tourist-tax — calcule (et met à jour) les montants dus par
// commune pour le semestre demandé (ou le semestre en cours par défaut),
// à partir des réservations réellement payées. N'effectue aucun virement :
// prépare uniquement les montants à déclarer/reverser (voir la migration).

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

function semestreActuel() {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = maintenant.getMonth(); // 0-11
  if (mois < 6) {
    return { label: `${annee}-S1`, debut: `${annee}-01-01`, fin: `${annee}-06-30` };
  }
  return { label: `${annee}-S2`, debut: `${annee}-07-01`, fin: `${annee}-12-31` };
}

export async function GET(req: NextRequest) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const semestreParam = req.nextUrl.searchParams.get("semestre");
  const { label, debut, fin } = semestreParam
    ? { label: semestreParam, debut: null, fin: null } // recalcul désactivé pour un semestre passé, lecture seule
    : semestreActuel();

  if (debut && fin) {
    // Recalcule les montants dus pour le semestre en cours, à partir des
    // réservations réellement payées (confirmée ou terminée) sur la période.
    const { data: reservations } = await supabaseAdmin
      .from("reservations")
      .select("tourist_tax_amount, listings ( city )")
      .not("tourist_tax_amount", "is", null)
      .in("status", ["confirmee", "terminee"])
      .gte("start_date", debut)
      .lte("start_date", fin);

    const parCommune: Record<string, { montant: number; nb: number }> = {};
    for (const r of reservations ?? []) {
      const commune = (r as any).listings?.city?.trim();
      if (!commune || !r.tourist_tax_amount) continue;
      if (!parCommune[commune]) parCommune[commune] = { montant: 0, nb: 0 };
      parCommune[commune].montant += r.tourist_tax_amount;
      parCommune[commune].nb += 1;
    }

    for (const [commune, { montant, nb }] of Object.entries(parCommune)) {
      // Ne touche jamais une ligne déjà marquée "verse" — un reversement
      // déjà effectué ne doit pas être silencieusement recalculé.
      const { data: existante } = await supabaseAdmin
        .from("tourist_tax_remittances")
        .select("id, status")
        .eq("commune", commune)
        .eq("semestre", label)
        .maybeSingle();

      if (existante?.status === "verse") continue;

      await supabaseAdmin.from("tourist_tax_remittances").upsert(
        {
          commune,
          semestre: label,
          period_start: debut,
          period_end: fin,
          amount_due: montant,
          reservation_count: nb,
          status: "a_verser",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "commune,semestre" }
      );
    }
  }

  const { data: lignes, error } = await supabaseAdmin
    .from("tourist_tax_remittances")
    .select("*")
    .eq("semestre", label)
    .order("amount_due", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Impossible de charger le suivi de la taxe de séjour." }, { status: 500 });
  }

  return NextResponse.json({ semestre: label, lignes });
}
