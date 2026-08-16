// Génère un fichier .ics à partir des réservations Escale d'un logement.
// C'est CE lien que l'hôte colle dans Airbnb > Calendrier > Disponibilités
// > "Associer des calendriers" > "Importer un calendrier".
//
// Aucune dépendance externe nécessaire : le format iCal est du texte simple.

export type ReservationForIcal = {
  id: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD" (date de départ, exclusive)
  guestName?: string;
};

function toIcalDate(date: string): string {
  // iCal attend AAAAMMJJ pour un événement "journée entière"
  return date.replaceAll("-", "");
}

function foldLine(line: string): string {
  // La RFC 5545 impose des lignes de 75 octets max ; on replie si besoin.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

export function generateIcalForListing(
  listingId: string,
  listingName: string,
  reservations: ReservationForIcal[]
): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const events = reservations.map((r) => {
    const lines = [
      "BEGIN:VEVENT",
      `UID:escale-${r.id}@escale.app`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcalDate(r.startDate)}`,
      `DTEND;VALUE=DATE:${toIcalDate(r.endDate)}`,
      `SUMMARY:${r.guestName ? "Réservé - " + r.guestName : "Réservé"}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    ];
    return lines.map(foldLine).join("\r\n");
  });

  const doc = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Escale//Calendrier logement//FR",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:Escale - ${listingName}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return doc;
}
