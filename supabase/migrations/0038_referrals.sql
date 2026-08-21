create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  audience text not null check (audience in ('voyageur','hote','mixte')) default 'mixte',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.referral_codes(id) on delete cascade,
  referred_user_id uuid references public.profiles(id) on delete set null,
  status text not null check (status in ('clic','inscription','reservation','recompense')) default 'clic',
  reward_cents integer not null default 0,
  created_at timestamptz not null default now(),
  converted_at timestamptz
);

create index if not exists idx_referrals_code_status on public.referrals(code_id,status);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

create policy "Chaque utilisateur voit ses codes" on public.referral_codes for select using (owner_id = auth.uid());
create policy "Chaque utilisateur crée ses codes" on public.referral_codes for insert with check (owner_id = auth.uid());
create policy "Le propriétaire voit les conversions de ses codes" on public.referrals for select using (code_id in (select id from public.referral_codes where owner_id = auth.uid()));
