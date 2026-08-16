// Récupère et parse le fichier .ics exporté par Airbnb (ou toute autre
// plateforme) pour en extraire les périodes réservées/bloquées.
//
// Dépendance : npm install node-ical

import ical from "node-ical";

export type ParsedBlock = {
  uid: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  summary?: string;
};

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchAndParseIcal(icalUrl: string): Promise<ParsedBlock[]> {
  // Airbnb fournit parfois le lien en "webcal://" — on le convertit en https.
  const url = icalUrl.replace(/^webcal:\/\//i, "https://");

  const data = await ical.async.fromURL(url, {
    headers: { "User-Agent": "EscaleCalendarSync/1.0" },
  });

  const blocks: ParsedBlock[] = [];

  for (const key of Object.keys((data as any) || {})) {
    const entry = data[key];
    if (entry.type !== "VEVENT") continue;
    if (!entry.start || !entry.end) continue;

    blocks.push({
      uid: entry.uid ?? key,
      startDate: toDateOnly(entry.start),
      endDate: toDateOnly(entry.end),
      summary: entry.summary,
    });
  }

  return blocks;
}
