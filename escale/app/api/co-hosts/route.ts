// POST /api/co-hosts — invite un co-hôte sur une annonce
// GET  /api/co-hosts?listingId=... — liste les co-hôtes d'une annonce

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Permissions par défaut associées à chaque niveau — modifiables ensuite
// individuellement via PATCH /api/co-hosts/:id.
const PERMISSIONS_PAR_NIVEAU = {
  gestion_complete: { can_edit_listing: true, can_manage_calendar: true, can_manage_reservations: true, can_reply_messages: true, can_view_finances: true },
  operationnel: { can_edit_listing: false, can_manage_calendar: true, can_manage_reservations: true, can_reply_messages: true, can_view_finances: false },
  messagerie_seule: { can_edit_listing: false, can_manage_calendar: false, can_manage_reservations: false, can_reply_messages: true, can_view_finances: false },
};

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour inviter un co-hôte." }, { status: 401 });
  }

  const { listingId, email, level } = await req.json();

  if (!listingId || !email?.trim() || !PERMISSIONS_PAR_NIVEAU[level]) {
    return NextResponse.json({ error: "Paramètres manquants ou niveau d'accès invalide." }, { status: 400 });
  }

  const { data: annonce, error: erreurAnnonce } = await supabase
    .from("listings")
    .select("id, host_id")
    .eq("id", listingId)
    .single();

  if (erreurAnnonce || !annonce) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }
  if (annonce.host_id !== user.id) {
    return NextResponse.json({ error: "Seul l'hôte principal peut inviter un co-hôte sur cette annonce." }, { status: 403 });
  }

  // Si un compte existe déjà pour cet e-mail, on le relie tout de suite ;
  // sinon co_host_id restera vide jusqu'à ce que la personne s'inscrive
  // avec cette adresse (à réconcilier alors côté inscription).
  const { data: profilExistant } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle();

  const { data: coHote, error: erreurCreation } = await supabase
    .from("co_hosts")
    .insert({
      listing_id: listingId,
      host_id: user.id,
      co_host_id: profilExistant?.id ?? null,
      co_host_email: email.trim(),
      level,
      ...PERMISSIONS_PAR_NIVEAU[level],
      status: profilExistant ? "actif" : "invite",
      accepted_at: profilExistant ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (erreurCreation) {
    const doublon = erreurCreation.code === "23505";
    return NextResponse.json(
      { error: doublon ? "Cette personne est déjà co-hôte sur cette annonce." : "Impossible de créer l'invitation." },
      { status: doublon ? 409 : 500 }
    );
  }

  // TODO : envoyer un e-mail d'invitation à `email` si aucun compte n'existait déjà.

  return NextResponse.json({ ok: true, coHost: coHote });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId manquant." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("co_hosts")
    .select("*")
    .eq("listing_id", listingId)
    .eq("host_id", user.id)
    .order("invited_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Impossible de charger les co-hôtes." }, { status: 500 });
  }

  return NextResponse.json({ coHosts: data });
}
