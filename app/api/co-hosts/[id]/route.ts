// PATCH /api/co-hosts/:id — change le niveau ou une permission précise
// DELETE /api/co-hosts/:id — révoque l'accès du co-hôte

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PERMISSIONS_PAR_NIVEAU: Record<string, Record<string, boolean>> = {
  gestion_complete: { can_edit_listing: true, can_manage_calendar: true, can_manage_reservations: true, can_reply_messages: true, can_view_finances: true },
  operationnel: { can_edit_listing: false, can_manage_calendar: true, can_manage_reservations: true, can_reply_messages: true, can_view_finances: false },
  messagerie_seule: { can_edit_listing: false, can_manage_calendar: false, can_manage_reservations: false, can_reply_messages: true, can_view_finances: false },
};

async function verifierProprietaire(supabase: any, coHostId: string, userId: string) {
  const { data } = await supabase.from("co_hosts").select("host_id").eq("id", coHostId).single();
  return data?.host_id === userId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }
  if (!(await verifierProprietaire(supabase, params.id, user.id))) {
    return NextResponse.json({ error: "Seul l'hôte principal peut modifier cet accès." }, { status: 403 });
  }

  const { level, permission, value } = await req.json();
  const misesAJour: Record<string, unknown> = {};

  if (level) {
    if (!PERMISSIONS_PAR_NIVEAU[level]) {
      return NextResponse.json({ error: "Niveau d'accès invalide." }, { status: 400 });
    }
    misesAJour.level = level;
    Object.assign(misesAJour, PERMISSIONS_PAR_NIVEAU[level]);
  } else if (permission) {
    // Ajustement fin d'une seule permission, sans changer le niveau affiché
    const permissionsValides = ["can_edit_listing", "can_manage_calendar", "can_manage_reservations", "can_reply_messages", "can_view_finances"];
    if (!permissionsValides.includes(permission)) {
      return NextResponse.json({ error: "Permission inconnue." }, { status: 400 });
    }
    misesAJour[permission] = !!value;
  } else {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const { error } = await supabase.from("co_hosts").update(misesAJour).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }
  if (!(await verifierProprietaire(supabase, params.id, user.id))) {
    return NextResponse.json({ error: "Seul l'hôte principal peut révoquer cet accès." }, { status: 403 });
  }

  // Révocation "douce" : on garde la ligne (traçabilité) mais on coupe l'accès.
  const { error } = await supabase.from("co_hosts").update({ status: "revoque" }).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: "Impossible de révoquer cet accès." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
