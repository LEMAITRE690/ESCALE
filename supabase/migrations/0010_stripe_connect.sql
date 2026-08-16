-- Reversement des paiements aux hôtes via Stripe Connect (comptes Express)

alter table public.profiles
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_complete boolean not null default false;

-- Un signalement en cours (voir procédure de médiation des CGU, Article 7)
-- bloque le reversement automatique tant qu'il n'est pas résolu.
alter table public.reservations
  add column if not exists has_open_dispute boolean not null default false;

-- Traçabilité des décisions prises par l'admin sur un signalement
create table if not exists public.dispute_resolutions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  action text not null,   -- liberer | rembourser | resoudre
  note text,
  created_at timestamptz not null default now()
);

-- Historique des paiements, avec répartition hôte / commission Escale
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  host_id uuid not null references public.profiles(id),
  stripe_payment_intent_id text not null unique,
  amount_total integer not null,        -- montant total payé par le voyageur, en centimes
  platform_fee integer not null,        -- commission Escale, en centimes
  amount_host integer not null,         -- part reversée à l'hôte, en centimes
  currency text not null default 'eur',
  status text not null default 'pending', -- pending | succeeded | failed | refunded
  transferred_at timestamptz,           -- date du virement effectif à l'hôte (null = fonds encore retenus)
  stripe_transfer_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_to_release
  on public.payments (status, transferred_at);

alter table public.payments enable row level security;

create policy "Hôte consulte ses propres paiements"
  on public.payments for select
  using (host_id = auth.uid());

-- Écritures réservées à la route serveur /api/stripe/webhook (clé service_role)
