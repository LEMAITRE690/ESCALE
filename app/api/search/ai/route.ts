// POST /api/search/ai
// Reçoit une phrase libre, tente une interprétation IA puis bascule sur un
// parseur local si le fournisseur IA est indisponible ou non configuré.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { interpreterRecherche, type FiltresRecherche } from "@/lib/anthropic/client";

const TYPES = ["appartement", "maison", "loft", "chalet", "cabane"];
const EQUIPEMENTS: Record<string, string[]> = {
  wifi: ["wifi", "wi-fi", "internet"],
  parking: ["parking", "stationnement", "garage"],
  cuisine: ["cuisine", "kitchen"],
  clim: ["clim", "climatisation", "air conditionne", "air conditionné"],
  piscine: ["piscine", "pool"],
};

function sansAccents(texte: string) {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function extraireNombre(texte: string, expressions: RegExp[]) {
  for (const expression of expressions) {
    const match = texte.match(expression);
    if (match?.[1]) return Number(match[1]);
  }
  return null;
}

function interpreterLocalement(phrase: string): FiltresRecherche {
  const brut = phrase.trim();
  const texte = sansAccents(brut);

  const prixMax = extraireNombre(texte, [
    /(?:budget(?: de)?|maximum|max|moins de|jusqu[' ]?a)\s*(\d{2,5})\s*(?:€|euros?)?/,
    /(\d{2,5})\s*(?:€|euros?)\s*(?:max|maximum|par nuit)?/,
  ]);
  const prixMin = extraireNombre(texte, [
    /(?:minimum|min|a partir de|plus de)\s*(\d{2,5})\s*(?:€|euros?)?/,
  ]);
  const voyageurs = extraireNombre(texte, [
    /(?:pour|a)\s*(\d{1,2})\s*(?:personnes?|voyageurs?|adultes?|enfants?)/,
    /(\d{1,2})\s*(?:personnes?|voyageurs?)/,
  ]);

  const type = TYPES.find((item) => texte.includes(item)) || null;
  const equipements = Object.entries(EQUIPEMENTS)
    .filter(([, synonymes]) => synonymes.some((mot) => texte.includes(sansAccents(mot))))
    .map(([id]) => id);

  const animaux = /\b(chien|chiens|chat|chats|animal|animaux|pet)\b/.test(texte) ? true : null;

  const villeMatch = brut.match(
    /(?:\bà\b|\ba\b|\bsur\b|\bvers\b|près de|proche de)\s+([A-Za-zÀ-ÿ' -]{2,40}?)(?=\s+(?:pour|avec|sans|budget|moins|maximum|max|minimum|min|proche|près|et)\b|[,.;]|$)/i
  );
  const ville = villeMatch?.[1]?.trim() || null;

  const morceaux = [
    ville ? `à ${ville}` : null,
    voyageurs ? `pour ${voyageurs} personne${voyageurs > 1 ? "s" : ""}` : null,
    type ? `en ${type}` : null,
    prixMax ? `jusqu’à ${prixMax} € par nuit` : null,
    equipements.length ? `avec ${equipements.join(", ")}` : null,
    animaux ? "acceptant les animaux" : null,
  ].filter(Boolean);

  return {
    ville,
    prixMax,
    prixMin,
    voyageurs,
    type,
    equipements,
    animaux,
    resume: morceaux.length
      ? `J’ai compris : ${morceaux.join(" · ")}.`
      : `J’ai compris votre demande : « ${brut} »`,
  };
}

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "Décrivez le logement que vous cherchez." }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ error: "Requête trop longue (300 caractères maximum)." }, { status: 400 });
  }

  let filtres: FiltresRecherche;
  let mode: "ia" | "secours" = "secours";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      filtres = await interpreterRecherche(query);
      mode = "ia";
    } catch (error) {
      console.error("Recherche IA indisponible, utilisation du parseur local :", error);
      filtres = interpreterLocalement(query);
    }
  } else {
    filtres = interpreterLocalement(query);
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

  const { data: logements, error } = await requete
    .order("average_rating", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Erreur Supabase recherche IA :", error);
    return NextResponse.json({ error: "Erreur lors de la recherche." }, { status: 500 });
  }

  return NextResponse.json({ filtres, resultats: logements ?? [], mode });
}
