// POST /api/legal/acceptances — enregistre l'acceptation d'un document.
//
// L'adresse IP et le navigateur sont relevés côté serveur : transmis par le
// client, ils n'auraient aucune valeur probante.
//
// L'identifiant du document accepté n'est pas non plus pris du corps de la
// requête. Il est relu depuis la version en vigueur, faute de quoi un client
// pourrait déclarer avoir accepté une version ancienne ou inexistante.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TYPES = ["cgu", "cgv_hotes", "cgl"] as const;

/** Première adresse de x-forwarded-for : celle du client, avant les proxys. */
function adresseIp(req: NextRequest): string | null {
  const entete = req.headers.get("x-forwarded-for");
  if (entete) return entete.split(",")[0].trim() || null;
  return req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { type, reservationId } = await req.json();

  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "Type de document inconnu." }, { status: 400 });
  }

  if (type === "cgl" && !reservationId) {
    return NextResponse.json(
      { error: "L'acceptation des CGL doit être rattachée à une réservation." },
      { status: 400 }
    );
  }

  const { data: document } = await supabaseAdmin
    .from("legal_documents_en_vigueur")
    .select("id, type, version")
    .eq("type", type)
    .maybeSingle();

  if (!document) {
    return NextResponse.json(
      { error: "Aucune version de ce document n'est en vigueur." },
      { status: 409 }
    );
  }

  // Pour les CGL, la réservation doit appartenir à l'utilisateur : sans ce
  // contrôle, n'importe qui pourrait signer pour le compte d'un autre.
  if (type === "cgl") {
    const { data: reservation } = await supabaseAdmin
      .from("reservations")
      .select("id, guest_id")
      .eq("id", reservationId)
      .maybeSingle();

    if (!reservation || reservation.guest_id !== user.id) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }
  }

  const { error } = await supabaseAdmin.from("legal_acceptances").insert({
    user_id: user.id,
    document_id: document.id,
    document_type: document.type,
    reservation_id: type === "cgl" ? reservationId : null,
    ip_address: adresseIp(req),
    user_agent: req.headers.get("user-agent"),
  });

  // Une acceptation déjà enregistrée n'est pas une erreur : l'index unique
  // garantit simplement qu'elle n'est pas comptée deux fois.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }

  return NextResponse.json({ version: document.version, acceptedAt: new Date().toISOString() });
}
