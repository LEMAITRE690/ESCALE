// GET /api/stripe/connect/refresh?userId=...
// Stripe redirige ici si le lien d'onboarding a expiré avant d'être complété.
// On régénère simplement un nouveau lien et on redirige l'hôte dessus.

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const origin = req.nextUrl.origin;

  const res = await fetch(`${origin}/api/stripe/connect/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const { url } = await res.json();

  return NextResponse.redirect(url ?? `${origin}/hote/parametres/paiements`);
}
