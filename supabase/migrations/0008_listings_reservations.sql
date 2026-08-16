-- Catalogue de logements et réservations — socle manquant des migrations
-- précédentes (0007-0009 y font déjà référence).

create type listing_status as enum ('en_moderation', 'actif', 'suspendu', 'signale');
create type reservation_status as enum ('en_attente', 'confirmee', 'terminee', 'annulee', 'remboursee');
create type cancellation_policy as enum ('flexible', 'moderee', 'stricte', 'tres_stricte', 'non_remboursable');

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  type text,
  description text,
  guests int not null default 1,
  bedrooms int not null default 0,
  bathrooms int not null default 0,

  address text,
  city text,
  postal_code text,
  address_details text,           -- masqué tant que la réservation n'est pas confirmée

  price_per_night numeric(10,2) not null default 0,
  amenities jsonb not null default '[]'::jsonb,

  pets_allowed boolean not null default false,
  pets_fee numeric(10,2),
  cleaning_fee numeric(10,2),
  late_checkout_available boolean not null default false,
  late_checkout_time text,
  late_checkout_fee numeric(10,2),
  early_checkin_available boolean not null default false,
  early_checkin_time text,
  early_checkin_fee numeric(10,2),
  min_stay_nights int,
  max_stay_nights int,
  instant_booking boolean not null default true,
  children_welcome boolean not null default false,
  crib_available boolean not null default false,
  high_chair_available boolean not null default false,
  smoking_allowed boolean not null default false,
  events_allowed boolean not null default false,
  cancellation_policy cancellation_policy not null default 'moderee',
  security_deposit numeric(10,2),

  insurance_confirmed boolean not null default false,
  status listing_status not null default 'en_moderation',

  photo_urls jsonb not null default '[]'::jsonb,
  cover_photo_url text,

  -- dénormalisé pour éviter un agrégat sur `reviews` à chaque affichage de carte
  average_rating numeric(2,1) not null default 0,
  review_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listings_status_city on public.listings (status, city);
create index if not exists idx_listings_host on public.listings (host_id);

alter table public.listings enable row level security;

create policy "Les annonces actives sont publiques"
  on public.listings for select
  using (status = 'actif' or host_id = auth.uid());

create policy "L'hôte gère ses propres annonces"
  on public.listings for all
  using (host_id = auth.uid());

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  guest_id uuid references public.profiles(id),

  guest_first_name text,          -- utilisé pour l'export iCal (jamais le nom complet)
  start_date date not null,
  end_date date not null,
  guests int not null default 1,
  amount_total integer not null,  -- en centimes, cohérent avec Stripe

  with_pet boolean not null default false,
  status reservation_status not null default 'en_attente',
  has_open_dispute boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists idx_reservations_listing_dates on public.reservations (listing_id, start_date, end_date);

alter table public.reservations enable row level security;

create policy "Le voyageur consulte ses propres réservations"
  on public.reservations for select
  using (guest_id = auth.uid());

create policy "L'hôte consulte les réservations de ses logements"
  on public.reservations for select
  using (listing_id in (select id from public.listings where host_id = auth.uid()));

create policy "Le voyageur crée sa propre réservation"
  on public.reservations for insert
  with check (guest_id = auth.uid());

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reservation_id uuid references public.reservations(id),
  guest_id uuid references public.profiles(id),
  guest_display_name text not null,   -- ex: "Julien M." — jamais le nom complet
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Les avis sont publics"
  on public.reviews for select
  using (true);

create policy "Le voyageur publie son propre avis"
  on public.reviews for insert
  with check (guest_id = auth.uid());

-- Maintient average_rating/review_count sur listings à chaque nouvel avis
create or replace function public.update_listing_rating()
returns trigger as $$
begin
  update public.listings
  set
    average_rating = (select round(avg(rating)::numeric, 1) from public.reviews where listing_id = new.listing_id),
    review_count = (select count(*) from public.reviews where listing_id = new.listing_id)
  where id = new.listing_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.update_listing_rating();
