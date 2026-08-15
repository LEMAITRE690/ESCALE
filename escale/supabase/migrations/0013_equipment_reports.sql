-- Signalement, par le voyageur, d'un équipement défectueux pendant son séjour
-- (distinct de l'état des lieux : peut être déclaré à tout moment du séjour,
-- pas seulement à l'entrée ou à la sortie).

create type equipment_report_status as enum ('nouveau', 'en_cours', 'resolu');

create table if not exists public.equipment_reports (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  guest_id uuid not null references public.profiles(id),

  item_name text not null,
  description text,
  photo_urls jsonb not null default '[]'::jsonb,
  status equipment_report_status not null default 'nouveau',
  host_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_equipment_reports_listing on public.equipment_reports (listing_id, status);

alter table public.equipment_reports enable row level security;

create policy "Le voyageur consulte et crée ses propres signalements"
  on public.equipment_reports for select
  using (guest_id = auth.uid());

create policy "Le voyageur crée un signalement sur sa réservation"
  on public.equipment_reports for insert
  with check (guest_id = auth.uid());

create policy "L'hôte consulte les signalements de ses logements"
  on public.equipment_reports for select
  using (listing_id in (select id from public.listings where host_id = auth.uid()));

create policy "L'hôte met à jour le statut et sa note"
  on public.equipment_reports for update
  using (listing_id in (select id from public.listings where host_id = auth.uid()))
  with check (listing_id in (select id from public.listings where host_id = auth.uid()));
