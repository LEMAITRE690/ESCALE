// GET /api/partners/grants — l'hôte liste les conciergeries ayant un accès actif
// DELETE /api/partners/grants — révoque l'accès super-hôte d'une conciergerie
//
// La révocation ne touche jamais listings.host_id : l'hôte reste
// propriétaire de toutes ses annonces avant, pendant et après avoir
// travaillé avec une conciergerie. Seul l'accès de gestion est coupé.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("partner_host_grants")
    .select("id, status, granted_at, revoked_at, partners ( id, name )")
    .eq("host_id", user.id)
    .order("granted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Impossible de charger vos conciergeries." }, { status: 500 });
  }

  return NextResponse.json({ grants: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { grantId } = await req.json();
  if (!grantId) {
    return NextResponse.json({ error: "grantId manquant." }, { status: 400 });
  }

  // La clause host_id = user.id garantit qu'un hôte ne peut révoquer que
  // ses propres accès — jamais ceux d'un autre hôte rattaché à la même
  // conciergerie.
  const { error } = await supabase
    .from("partner_host_grants")
    .update({ status: "revoque", revoked_at: new Date().toISOString() })
    .eq("id", grantId)
    .eq("host_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Impossible de révoquer cet accès." }, { status: 500 });
  }

  // Vos annonces restent intégralement les vôtres — seul l'accès de
  // gestion de la conciergerie est coupé, immédiatement.
  return NextResponse.json({ ok: true });
}
