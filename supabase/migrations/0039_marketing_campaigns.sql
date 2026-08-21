create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('email','push','sms')) default 'email',
  segment text not null,
  status text not null check (status in ('brouillon','planifiee','en_cours','terminee','suspendue')) default 'brouillon',
  subject text,
  content text,
  scheduled_at timestamptz,
  sent_count integer not null default 0,
  open_count integer not null default 0,
  click_count integer not null default 0,
  booking_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_campaigns_status on public.marketing_campaigns(status, scheduled_at);
alter table public.marketing_campaigns enable row level security;
