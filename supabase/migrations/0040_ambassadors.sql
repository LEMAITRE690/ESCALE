create table if not exists public.ambassadors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  kind text not null check (kind in ('conciergerie','createur','proprietaire','partenaire_local')),
  code text not null unique,
  commission_rate numeric(5,2) not null default 0,
  status text not null check (status in ('candidat','actif','suspendu')) default 'candidat',
  clicks integer not null default 0,
  bookings integer not null default 0,
  revenue_cents bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ambassadors_status on public.ambassadors(status, kind);
alter table public.ambassadors enable row level security;
