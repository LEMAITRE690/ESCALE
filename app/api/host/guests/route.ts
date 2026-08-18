// GET /api/host/guests — voyageurs ayant déjà séjourné chez l'hôte connecté.
//
// Première brique du CRM : l'agrégat vient de la vue host_guest_summary, qui
// ne compte que les réservations confirmées ou terminées.
//
// Le filtre sur host_id n'est pas optionnel : une vue Postgres s'exécute avec
// les droits de son propriétaire et ne se voit donc pas appliquer les policies
// RLS de ses tables sources.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { nomAffiche } from "@/lib/crm/voyageurs";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data: agregats, error } = await supabaseAdmin
    .from("host_guest_summary")
    .select("*")
    .eq("host_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Lecture des voyageurs impossible." }, { status: 500 });
  }

  const ids = (agregats ?? []).map((a: any) => a.guest_id);
  if (ids.length === 0) return NextResponse.json({ voyageurs: [] });

  const { data: profils } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  const { data: notes } = await supabaseAdmin
    .from("host_guest_notes")
    .select("guest_id, note, updated_at")
    .eq("host_id", user.id)
    .in("guest_id", ids);

  const nomParId = new Map((profils ?? []).map((p: any) => [p.id, p.full_name]));
  const noteParId = new Map((notes ?? []).map((n: any) => [n.guest_id, n]));

  return NextResponse.json({
    voyageurs: (agregats ?? []).map((a: any) => ({
      guestId: a.guest_id,
      nom: nomAffiche(nomParId.get(a.guest_id)),
      nbSejours: a.nb_sejours,
      premierSejour: a.premier_sejour,
      dernierSejour: a.dernier_sejour,
      totalDepense: a.total_depense,
      dureeMoyenneNuits: a.duree_moyenne_nuits === null ? null : Number(a.duree_moyenne_nuits),
      sejoursAvecAnimal: a.sejours_avec_animal,
      logements: a.logements ?? [],
      noteMoyenneLaissee:
        a.note_moyenne_laissee === null ? null : Number(a.note_moyenne_laissee),
      nbAvisLaisses: a.nb_avis_laisses,
      aUneNote: Boolean(noteParId.get(a.guest_id)?.note?.trim()),
    })),
  });
}
