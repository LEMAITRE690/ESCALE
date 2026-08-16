-- Programme partenaires conciergeries : une conciergerie qui apporte un
-- hôte sur Escale perçoit une rétrocommission de 1 point sur la commission
-- de 6% payée par cet hôte (formule Commission uniquement — la formule
-- Abonnement n'entre pas dans ce dispositif). Escale conserve alors 5%
-- au lieu de 6% ; le montant reversé à l'hôte, lui, ne change jamais.

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,                       -- nom de la conciergerie
  email text not null,
  referral_code text not null unique,       -- code que les hôtes renseignent pour être rattachés

  stripe_account_id text,
  stripe_onboarding_complete boolean not null default false,

  status text not null default 'actif',     -- actif | suspendu
  created_at timestamptz not null default now()
);

create unique index if not exists idx_partners_referral_code on public.partners (referral_code);

alter table public.partners enable row level security;

-- Aucune policy de lecture publique volontairement : la gestion d'un
-- partenaire se fait exclusivement via des routes serveur (clé service_role),
-- jamais directement depuis le client.

-- Rattache un hôte à la conciergerie qui l'a apporté. Nul par défaut : la
-- grande majorité des hôtes n'ont pas de partenaire.
alter table public.profiles
  add column if not exists referred_by_partner_id uuid references public.partners(id);

-- Trace, sur chaque paiement, la part éventuellement reversée au partenaire —
-- distincte de platform_fee (qui reste la part nette conservée par Escale).
alter table public.payments
  add column if not exists partner_id uuid references public.partners(id),
  add column if not exists partner_fee integer,              -- en centimes
  add column if not exists partner_transferred_at timestamptz,
  add column if not exists stripe_partner_transfer_id text;

comment on column public.payments.partner_fee is
  'Rétrocommission versée au partenaire conciergerie (1 point sur les 6% de la formule Commission), en centimes. Nul si aucun partenaire.';
