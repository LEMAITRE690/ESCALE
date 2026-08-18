-- CRM ESCALE V1 : clients 360, notes/tags, charges et documents de reservation.
-- Le CRM appartient a l'hote. Les politiques RLS evitent qu'un hote voie le
-- portefeuille clients ou les charges d'un autre hote.

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid references public.profiles(id) on delete set null,
  email text,
  full_name text not null,
  phone text,
  language text,
  source text not null default 'escale',
  marketing_consent boolean not null default false,
  private_notes text,
  tags text[] not null default '{}',
  first_stay_at date,
  last_stay_at date,
  stays_count integer not null default 0,
  nights_count integer not null default 0,
  lifetime_value_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists crm_contacts_host_guest_unique
  on public.crm_contacts(host_id, guest_id) where guest_id is not null;
create index if not exists crm_contacts_host_name on public.crm_contacts(host_id, full_name);
create index if not exists crm_contacts_host_last_stay on public.crm_contacts(host_id, last_stay_at desc);

alter table public.crm_contacts enable row level security;
create policy "L hote gere ses contacts CRM" on public.crm_contacts for all
  using (host_id = auth.uid()) with check (host_id = auth.uid());

create table if not exists public.host_expenses (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  category text not null,
  label text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  expense_date date not null default current_date,
  recurring boolean not null default false,
  recurrence text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists host_expenses_host_date on public.host_expenses(host_id, expense_date desc);
alter table public.host_expenses enable row level security;
create policy "L hote gere ses charges" on public.host_expenses for all
  using (host_id = auth.uid()) with check (host_id = auth.uid());

create table if not exists public.reservation_documents (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  title text not null,
  storage_path text,
  status text not null default 'disponible',
  created_at timestamptz not null default now()
);
create index if not exists reservation_documents_host on public.reservation_documents(host_id, created_at desc);
alter table public.reservation_documents enable row level security;
create policy "L hote consulte ses documents de reservation" on public.reservation_documents for select
  using (host_id = auth.uid());

-- Reconstruit les indicateurs CRM a partir des reservations de l'hote.
-- Cette fonction ne copie pas les donnees d'un voyageur chez un autre hote.
create or replace function public.crm_refresh_host_contacts(p_host_id uuid)
returns void as $$
begin
  if auth.uid() is not null and auth.uid() <> p_host_id then
    raise exception 'Non autorise';
  end if;

  insert into public.crm_contacts (
    host_id, guest_id, email, full_name, first_stay_at, last_stay_at,
    stays_count, nights_count, lifetime_value_cents, updated_at
  )
  select
    p_host_id,
    r.guest_id,
    p.email,
    coalesce(p.full_name, r.guest_first_name, 'Voyageur'),
    min(r.start_date),
    max(r.end_date),
    count(*) filter (where r.status in ('confirmee','terminee'))::int,
    coalesce(sum((r.end_date-r.start_date)) filter (where r.status in ('confirmee','terminee')),0)::int,
    coalesce(sum(r.amount_total) filter (where r.status in ('confirmee','terminee')),0)::bigint,
    now()
  from public.reservations r
  join public.listings l on l.id=r.listing_id and l.host_id=p_host_id
  left join public.profiles p on p.id=r.guest_id
  where r.guest_id is not null
  group by r.guest_id,p.email,p.full_name,r.guest_first_name
  on conflict (host_id,guest_id) where guest_id is not null do update set
    email=excluded.email,
    full_name=excluded.full_name,
    first_stay_at=excluded.first_stay_at,
    last_stay_at=excluded.last_stay_at,
    stays_count=excluded.stays_count,
    nights_count=excluded.nights_count,
    lifetime_value_cents=excluded.lifetime_value_cents,
    updated_at=now();
end;
$$ language plpgsql security definer set search_path=public;
