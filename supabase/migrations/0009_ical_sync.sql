-- Synchronisation des calendriers externes (Airbnb, Booking, Abritel...) via iCal
-- À exécuter avec : supabase db push (ou via le SQL editor du dashboard Supabase)

-- 1. Lien(s) iCal externes à importer, par logement
create table if not exists public.ical_sources (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  label text not null default 'Airbnb',           -- ex: "Airbnb", "Booking.com"
  ical_url text not null,                          -- lien .ics fourni par la plateforme externe
  last_synced_at timestamptz,
  last_sync_status text default 'pending',         -- pending | ok | error
  last_sync_error text,
  created_at timestamptz not null default now()
);

-- 2. Dates bloquées importées depuis un calendrier externe
--    (une ligne par événement VEVENT trouvé dans le fichier .ics)
create table if not exists public.external_calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  ical_source_id uuid not null references public.ical_sources(id) on delete cascade,
  uid text not null,                                -- UID de l'événement iCal (pour upsert idempotent)
  start_date date not null,
  end_date date not null,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ical_source_id, uid)
);

create index if not exists idx_external_blocks_listing_dates
  on public.external_calendar_blocks (listing_id, start_date, end_date);

-- 3. RLS : un hôte ne voit/gère que ses propres sources et blocages
alter table public.ical_sources enable row level security;
alter table public.external_calendar_blocks enable row level security;

create policy "Hôte gère ses sources iCal"
  on public.ical_sources for all
  using (
    listing_id in (select id from public.listings where host_id = auth.uid())
  );

create policy "Hôte consulte les blocages de ses logements"
  on public.external_calendar_blocks for select
  using (
    listing_id in (select id from public.listings where host_id = auth.uid())
  );

-- Remarque : les écritures dans external_calendar_blocks se font uniquement
-- via la route serverless /api/cron/sync-ical, avec la clé service_role
-- (elle contourne RLS), jamais depuis le client.
