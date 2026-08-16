// POST /api/search/ai
// Reçoit une phrase libre ("un logement avec piscine pour 4 personnes,
// budget 150€"), la fait interpréter par Claude en filtres structurés, puis
// exécute une requête Supabase classique avec ces filtres — jamais de
// requête floue en base, uniquement une extraction d'intention en amont.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { interpreterRecherche } from "@/lib/anthropic/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ error: "Décrivez le logement que vous cherchez." }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ error: "Requête trop longue (300 caractères maximum)." }, { status: 400 });
  }

  let filtres;
  try {
    filtres = await interpreterRecherche(query);
  } catch {
    return NextResponse.json(
      { error: "Impossible d'interpréter votre recherche pour le moment. Essayez la recherche classique." },
      { status: 502 }
    );
  }

  let requete = supabase
    .from("listings")
    .select("id, title, city, type, price_per_night, average_rating, review_count, guests, amenities, pets_allowed, instant_booking")
    .eq("status", "actif");

  if (filtres.ville) requete = requete.ilike("city", `%${filtres.ville}%`);
  if (filtres.prixMax) requete = requete.lte("price_per_night", filtres.prixMax);
  if (filtres.prixMin) requete = requete.gte("price_per_night", filtres.prixMin);
  if (filtres.voyageurs) requete = requete.gte("guests", filtres.voyageurs);
  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (filtres.animaux) requete = requete.eq("pets_allowed", true);
  if (filtres.equipements?.length) requete = requete.contains("amenities", filtres.equipements);

  const { data: logements, error } = await requete.order("average_rating", { ascending: false }).limit(30);

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la recherche." }, { status: 500 });
  }

  return NextResponse.json({ filtres, resultats: logements ?? [] });
}
