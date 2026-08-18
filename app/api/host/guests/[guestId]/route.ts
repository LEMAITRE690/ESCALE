// GET /api/host/guests/:guestId  — fiche détaillée d'un voyageur
// PUT /api/host/guests/:guestId  — enregistre la note privée de l'hôte
//
// Les deux vérifient que ce voyageur a bien séjourné chez l'hôte connecté,
// via la même fonction que les policies RLS : la définition du lien
// hôte/voyageur n'existe qu'à un seul endroit.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { nomAffiche } from "@/lib/crm/voyageurs";

async function hoteAutorise(guestId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: autorise } = await supabaseAdmin.rpc("voyageur_de_l_hote", {
    p_host_id: user.id,
    p_guest_id: guestId,
  });

  return autorise === true ? user : null;
}

/**
 * Préférences déduites de l'historique. Volontairement descriptives et
 * jamais affirmatives : ce sont des régularités observées sur un petit
 * nombre de séjours, pas un profil.
 */
function deduirePreferences(reservations: any[]) {
  const total = reservations.length;
  if (total === 0) return [];

  const preferences: string[] = [];
  const avecAnimal = reservations.filter((r) => r.with_pet).length;
  const nuits = reservations.map(
    (r) =>
      (new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) / 86400000
  );
  const nuitsMoyennes = nuits.reduce((a, b) => a + b, 0) / total;
  const voyageursMoyens =
    reservations.reduce((a, r) => a + (r.guests ?? 1), 0) / total;

  if (avecAnimal / total >= 0.5) {
    preferences.push(
      `Voyage avec un animal (${avecAnimal} séjour${avecAnimal > 1 ? "s" : ""} sur ${total})`
    );
  }
  if (voyageursMoyens <= 1.4) preferences.push("Voyage seul le plus souvent");
  else if (voyageursMoyens <= 2.4) preferences.push("Voyage en couple le plus souvent");
  else preferences.push(`Voyage à ${Math.round(voyageursMoyens)} en moyenne`);

  if (nuitsMoyennes <= 2.5) preferences.push("Privilégie les courts séjours et week-ends");
  else if (nuitsMoyennes >= 6) preferences.push("Privilégie les séjours d'une semaine ou plus");
  else preferences.push(`Séjours de ${nuitsMoyennes.toFixed(1)} nuits en moyenne`);

  // Saison dominante, seulement si elle se dégage nettement.
  const saisons = { hiver: 0, printemps: 0, ete: 0, automne: 0 } as Record<string, number>;
  for (const r of reservations) {
    const mois = new Date(r.start_date).getMonth();
    if (mois <= 1 || mois === 11) saisons.hiver++;
    else if (mois <= 4) saisons.printemps++;
    else if (mois <= 7) saisons.ete++;
    else saisons.automne++;
  }
  const [saison, compte] = Object.entries(saisons).sort((a, b) => b[1] - a[1])[0];
  const libelles: Record<string, string> = {
    hiver: "en hiver",
    printemps: "au printemps",
    ete: "en été",
    automne: "en automne",
  };
  if (total >= 2 && compte / total >= 0.6) {
    preferences.push(`Réserve surtout ${libelles[saison]}`);
  }

  return preferences;
}

export async function GET(_req: NextRequest, { params }: { params: { guestId: string } }) {
  const user = await hoteAutorise(params.guestId);
  if (!user) {
    return NextResponse.json({ error: "Voyageur introuvable." }, { status: 404 });
  }

  const { data: mesAnnonces } = await supabaseAdmin
    .from("listings")
    .select("id")
    .eq("host_id", user.id);

  const idsAnnonces = (mesAnnonces ?? []).map((l: any) => l.id);

  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select(
      "id, start_date, end_date, guests, amount_total, with_pet, status, created_at, listings(title, city)"
    )
    .eq("guest_id", params.guestId)
    .in("listing_id", idsAnnonces.length ? idsAnnonces : ["00000000-0000-0000-0000-000000000000"])
    .order("start_date", { ascending: false });

  const { data: profil } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", params.guestId)
    .maybeSingle();

  const { data: note } = await supabaseAdmin
    .from("host_guest_notes")
    .select("note, updated_at")
    .eq("host_id", user.id)
    .eq("guest_id", params.guestId)
    .maybeSingle();

  const { data: avis } = await supabaseAdmin
    .from("reviews")
    .select("rating, comment, created_at, listings!inner(title, host_id)")
    .eq("guest_id", params.guestId)
    .eq("listings.host_id", user.id)
    .order("created_at", { ascending: false });

  const confirmees = (reservations ?? []).filter((r: any) =>
    ["confirmee", "terminee"].includes(r.status)
  );

  return NextResponse.json({
    guestId: params.guestId,
    nom: nomAffiche(profil?.full_name),
    reservations: (reservations ?? []).map((r: any) => ({
      id: r.id,
      debut: r.start_date,
      fin: r.end_date,
      voyageurs: r.guests,
      montant: r.amount_total,
      avecAnimal: r.with_pet,
      statut: r.status,
      logement: [r.listings?.title, r.listings?.city].filter(Boolean).join(" — "),
    })),
    preferences: deduirePreferences(confirmees),
    avis: (avis ?? []).map((a: any) => ({
      note: a.rating,
      commentaire: a.comment,
      date: a.created_at,
      logement: a.listings?.title,
    })),
    note: note?.note ?? "",
    noteMiseAJourLe: note?.updated_at ?? null,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { guestId: string } }) {
  const user = await hoteAutorise(params.guestId);
  if (!user) {
    return NextResponse.json({ error: "Voyageur introuvable." }, { status: 404 });
  }

  const { note } = await req.json();
  if (typeof note !== "string") {
    return NextResponse.json({ error: "Note invalide." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("host_guest_notes")
    .upsert(
      { host_id: user.id, guest_id: params.guestId, note: note.slice(0, 5000) },
      { onConflict: "host_id,guest_id" }
    );

  if (error) {
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
}
