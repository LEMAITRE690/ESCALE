import { NextRequest, NextResponse } from "next/server";

/**
 * Retour navigateur Lemonway. Ce point d'entrée ne confirme JAMAIS le paiement :
 * un retour navigateur peut être rejoué ou falsifié. La confirmation provient
 * uniquement de la vérification serveur-à-serveur effectuée par le webhook.
 */
export async function GET(req: NextRequest) {
  const reservationId = req.nextUrl.searchParams.get("reservationId");
  const outcome = req.nextUrl.searchParams.get("outcome") || "return";

  if (!reservationId) {
    return NextResponse.redirect(new URL("/reservations", req.url));
  }

  const statut = outcome === "cancel"
    ? "annule"
    : outcome === "error"
      ? "erreur"
      : "traitement";

  return NextResponse.redirect(
    new URL(`/reservations/${reservationId}?statut=${statut}`, req.url)
  );
}

// Lemonway peut également POSTer sur les URLs de retour. Même principe :
// on ne fait aucune confiance métier au contenu, on renvoie seulement le
// navigateur vers l'écran de réservation.
export async function POST(req: NextRequest) {
  return GET(req);
}
