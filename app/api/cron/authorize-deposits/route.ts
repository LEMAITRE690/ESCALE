// GET /api/cron/authorize-deposits
// Exécutée chaque jour : autorise la caution des réservations dont le
// séjour débute aujourd'hui et qui ont une carte enregistrée.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const origin = req.nextUrl.origin;

  const { data: reservations } = await supabase
    .from("reservations")
    .select("id")
    .eq("start_date", aujourdhui)
    .eq("status", "confirmee")
    .eq("deposit_status", "carte_enregistree");

  const resultats: Array<{ id: string; ok: boolean }> = [];

  for (const r of reservations ?? []) {
    const res = await fetch(`${origin}/api/deposits/authorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: r.id }),
    });
    resultats.push({ id: r.id, ok: res.ok });
  }

  return NextResponse.json({ traite: resultats.length, resultats });
}
