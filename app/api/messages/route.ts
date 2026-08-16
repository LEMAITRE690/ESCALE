// POST /api/messages — envoie un message (filtrage des coordonnées appliqué systématiquement)
// GET  /api/messages?reservationId=... — lit les messages d'une conversation

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { filtrerCoordonnees } from "@/lib/messaging/filtrerCoordonnees";

async function trouverOuCreerConversation(reservationId: string, userId: string) {
  const { data: reservation } = await supabaseAdmin
    .from("reservations")
    .select("id, guest_id, listings ( host_id )")
    .eq("id", reservationId)
    .single();

  if (!reservation) return { erreur: "Réservation introuvable." as const };

  const hostId = (reservation as any).listings?.host_id;
  const guestId = reservation.guest_id;

  if (userId !== hostId && userId !== guestId) {
    return { erreur: "Vous n'êtes pas partie à cette réservation." as const };
  }

  const { data: conversation } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("reservation_id", reservationId)
    .maybeSingle();

  if (conversation) return { conversationId: conversation.id };

  const { data: nouvelle, error } = await supabaseAdmin
    .from("conversations")
    .insert({ reservation_id: reservationId, host_id: hostId, guest_id: guestId })
    .select("id")
    .single();

  if (error || !nouvelle) return { erreur: "Impossible de créer la conversation." as const };
  return { conversationId: nouvelle.id };
}

export async function POST(req: NextRequest) {
  const authClient = createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { reservationId, content } = await req.json();
  if (!reservationId || !content?.trim()) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Message trop long (2000 caractères maximum)." }, { status: 400 });
  }

  const resultat = await trouverOuCreerConversation(reservationId, user.id);
  if ("erreur" in resultat) {
    return NextResponse.json({ error: resultat.erreur }, { status: 403 });
  }

  // Le filtrage est appliqué ici, avant toute écriture — c'est le seul
  // chemin d'insertion possible (aucune policy INSERT client sur `messages`).
  const { contenuFiltre, contientCoordonnees } = filtrerCoordonnees(content.trim());

  const { data: message, error } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: resultat.conversationId,
      sender_id: user.id,
      content: contenuFiltre,
      content_original: content.trim(),
      contains_contact_info: contientCoordonnees,
    })
    .select("id, content, contains_contact_info, created_at")
    .single();

  if (error || !message) {
    return NextResponse.json({ error: "Impossible d'envoyer le message." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message,
    avertissement: contientCoordonnees
      ? "Les coordonnées personnelles (téléphone, e-mail, liens) sont automatiquement masquées : toute réservation doit être conclue via Escale pour rester protégée."
      : null,
  });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const reservationId = req.nextUrl.searchParams.get("reservationId");
  if (!reservationId) {
    return NextResponse.json({ error: "reservationId manquant." }, { status: 400 });
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("reservation_id", reservationId)
    .maybeSingle();

  if (!conversation) {
    return NextResponse.json({ messages: [], currentUserId: user.id }); // pas encore de conversation démarrée
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Impossible de charger les messages." }, { status: 500 });
  }

  return NextResponse.json({ messages, currentUserId: user.id });
}
