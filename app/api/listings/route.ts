import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { z } from "zod";

// GET /api/listings?category=montagne&city=Chamonix
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const city = searchParams.get("city");

  const conditions: string[] = ["status = 'publie'"];
  const params: any[] = [];

  if (category && category !== "Tout") {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (city) {
    params.push(`%${city}%`);
    conditions.push(`city ILIKE $${params.length}`);
  }

  const listings = await query(
    `SELECT id, title, city, category, price_per_night, max_guests
     FROM listings
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT 40`,
    params
  );

  return NextResponse.json({ listings });
}

const createListingSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(["bord_de_mer", "montagne", "ville", "campagne"]),
  address: z.string(),
  city: z.string(),
  price_per_night: z.number().positive(),
  max_guests: z.number().int().positive(),
});

// POST /api/listings — création d'une annonce (hôte authentifié)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createListingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // NOTE: brancher ici la vérification de session (getServerSession)
  // pour récupérer host_id à partir de l'utilisateur connecté.

  const { title, description, category, address, city, price_per_night, max_guests } = parsed.data;

  const [listing] = await query(
    `INSERT INTO listings (host_id, title, description, category, address, city, price_per_night, max_guests, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'brouillon')
     RETURNING id`,
    ["REMPLACER_PAR_HOST_ID_SESSION", title, description ?? null, category, address, city, price_per_night, max_guests]
  );

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
