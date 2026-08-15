-- ============================================================
-- Schéma de base de données — Escale (app de réservation type Airbnb)
-- PostgreSQL (compatible Supabase / Neon)
-- ============================================================

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- pour empêcher les doubles réservations

-- ---------------------------------------------------------------
-- UTILISATEURS
-- ---------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('voyageur', 'hote', 'les_deux', 'admin');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    avatar_url      TEXT,
    phone           TEXT,
    role            user_role NOT NULL DEFAULT 'voyageur',
    bio             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- LOGEMENTS
-- ---------------------------------------------------------------
CREATE TYPE listing_category AS ENUM ('bord_de_mer', 'montagne', 'ville', 'campagne');
CREATE TYPE listing_status AS ENUM ('brouillon', 'publie', 'suspendu');

CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    category        listing_category NOT NULL,
    status          listing_status NOT NULL DEFAULT 'brouillon',

    address         TEXT NOT NULL,
    city            TEXT NOT NULL,
    country         TEXT NOT NULL DEFAULT 'France',
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),

    price_per_night NUMERIC(10,2) NOT NULL CHECK (price_per_night > 0),
    cleaning_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_guests      SMALLINT NOT NULL CHECK (max_guests > 0),
    bedrooms        SMALLINT NOT NULL DEFAULT 1,
    beds            SMALLINT NOT NULL DEFAULT 1,
    bathrooms       SMALLINT NOT NULL DEFAULT 1,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_category ON listings(category);

-- Photos d'un logement (plusieurs par logement, ordonnées)
CREATE TABLE listing_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    position    SMALLINT NOT NULL DEFAULT 0
);

-- Équipements (wifi, piscine, parking...) en relation many-to-many
CREATE TABLE amenities (
    id      SERIAL PRIMARY KEY,
    name    TEXT UNIQUE NOT NULL
);

CREATE TABLE listing_amenities (
    listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    amenity_id   INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (listing_id, amenity_id)
);

-- ---------------------------------------------------------------
-- RÉSERVATIONS
-- ---------------------------------------------------------------
CREATE TYPE booking_status AS ENUM ('en_attente', 'confirmee', 'annulee', 'terminee');

CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    guest_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    guests_count    SMALLINT NOT NULL DEFAULT 1,
    total_price     NUMERIC(10,2) NOT NULL,
    status          booking_status NOT NULL DEFAULT 'en_attente',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (check_out > check_in),

    -- Empêche deux réservations confirmées de se chevaucher sur le même logement
    EXCLUDE USING gist (
        listing_id WITH =,
        daterange(check_in, check_out) WITH &&
    ) WHERE (status IN ('en_attente', 'confirmee'))
);

CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);

-- ---------------------------------------------------------------
-- PAIEMENTS (intégration Stripe)
-- ---------------------------------------------------------------
CREATE TYPE payment_status AS ENUM ('en_attente', 'reussi', 'echoue', 'rembourse');

CREATE TABLE payments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id                  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount                      NUMERIC(10,2) NOT NULL,
    currency                    TEXT NOT NULL DEFAULT 'eur',
    stripe_payment_intent_id    TEXT UNIQUE,
    status                      payment_status NOT NULL DEFAULT 'en_attente',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- AVIS
-- ---------------------------------------------------------------
CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id);

-- ---------------------------------------------------------------
-- FAVORIS
-- ---------------------------------------------------------------
CREATE TABLE favorites (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
);
