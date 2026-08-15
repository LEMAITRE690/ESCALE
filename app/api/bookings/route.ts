import { NextRequest, NextResponse } from "next/server";
import { query, pool } from "@/lib/db";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const bookingSchema = z.object({
  listing_id: z.string().uuid(),
  check_in: z.string(),   // format YYYY-MM-DD
  check_out: z.string(),
  guests_count: z.number().int().positive(),
});

// POST /api/bookings — crée une réservation + intention de paiement Stripe
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { listing_id, check_in, check_out, guests_count } = parsed.data;

  // NOTE: brancher ici getServerSession pour obtenir guest_id réel
  const guest_id = "REMPLACER_PAR_USER_ID_SESSION";

  const [listing] = await query(
    `SELECT price_per_night, cleaning_fee, max_guests FROM listings WHERE id = $1`,
    [listing_id]
  );
  if (!listing) {
    return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
  }
  if (guests_count > listing.max_guests) {
    return NextResponse.json({ error: "Capacité maximale dépassée" }, { status: 400 });
  }

  const nights =
    (new Date(check_out).getTime() - new Date(check_in).getTime()) / (1000 * 60 * 60 * 24);
  if (nights <= 0) {
    return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
  }
  const total_price = nights * Number(listing.price_per_night) + Number(listing.cleaning_fee);

  // Transaction : la contrainte EXCLUDE en base rejette automatiquement
  // les chevauchements de dates (voir schema_base_de_donnees.sql)
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertRes = await client.query(
      `INSERT INTO bookings (listing_id, guest_id, check_in, check_out, guests_count, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'en_attente')
       RETURNING id`,
      [listing_id, guest_id, check_in, check_out, guests_count, total_price]
    );
    const booking = insertRes.rows[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total_price * 100), // Stripe attend des centimes
      currency: "eur",
      metadata: { booking_id: booking.id },
    });

    await client.query(
      `INSERT INTO payments (booking_id, amount, currency, stripe_payment_intent_id, status)
       VALUES ($1, $2, 'eur', $3, 'en_attente')`,
      [booking.id, total_price, paymentIntent.id]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      booking_id: booking.id,
      client_secret: paymentIntent.client_secret,
      total_price,
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    // Code 23P01 = violation de la contrainte d'exclusion (dates déjà réservées)
    if (err.code === "23P01") {
      return NextResponse.json(
        { error: "Ces dates ne sont plus disponibles pour ce logement" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Erreur lors de la réservation" }, { status: 500 });
  } finally {
    client.release();
  }
}
