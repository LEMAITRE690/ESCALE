// GET /api/cron/sync-ical
// Déclenchée automatiquement par Vercel Cron (voir vercel.json).
// Parcourt toutes les sources iCal enregistrées (ex: lien Airbnb de chaque
// logement), récupère les dates réservées côté Airbnb, et les enregistre
// comme "blocages externes" dans Escale pour empêcher toute double réservation.

import { NextRequest, NextResponse } from "next/server";
// Le client service role est nécessaire ici : seule cette route écrit dans
// external_calendar_blocks.
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { fetchAndParseIcal } from "@/lib/ical/parse";

export async function GET(req: NextRequest) {
  // Vercel Cron envoie un header d'authentification interne à vérifier.
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: sources, error } = await supabase
    .from("ical_sources")
    .select("id, listing_id, ical_url, label");

  if (error) {
    return NextResponse.json({ error: "Lecture des sources impossible" }, { status: 500 });
  }

  const results: Array<{ sourceId: string; status: string; blocks?: number; error?: string }> = [];

  for (const source of sources ?? []) {
    try {
      const blocks = await fetchAndParseIcal(source.ical_url);

      // Upsert idempotent : une ligne par UID d'événement Airbnb
      const rows = blocks.map((b) => ({
        listing_id: source.listing_id,
        ical_source_id: source.id,
        uid: b.uid,
        start_date: b.startDate,
        end_date: b.endDate,
        summary: b.summary ?? null,
        updated_at: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        await supabase
          .from("external_calendar_blocks")
          .upsert(rows, { onConflict: "ical_source_id,uid" });
      }

      await supabase
        .from("ical_sources")
        .update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: "ok",
          last_sync_error: null,
        })
        .eq("id", source.id);

      results.push({ sourceId: source.id, status: "ok", blocks: rows.length });
    } catch (err: any) {
      await supabase
        .from("ical_sources")
        .update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: "error",
          last_sync_error: String(err?.message ?? err),
        })
        .eq("id", source.id);

      results.push({ sourceId: source.id, status: "error", error: String(err?.message ?? err) });
    }
  }

  return NextResponse.json({ synced: results.length, results });
}
