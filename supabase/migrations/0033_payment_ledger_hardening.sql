-- Durcissement du grand livre de paiement.
-- 1) la taxe de séjour est isolée du net hôte ;
-- 2) les paiements peuvent provenir d'un PSP autre que Stripe ;
-- 3) chaque paiement externe est identifiable de manière unique.

alter table public.payments
  add column if not exists tourist_tax_held integer not null default 0,
  add column if not exists payment_provider text not null default 'stripe',
  add column if not exists payment_channel text not null default 'card',
  add column if not exists provider_payment_id text;

update public.payments
set provider_payment_id = stripe_payment_intent_id
where provider_payment_id is null and stripe_payment_intent_id is not null;

create unique index if not exists idx_payments_provider_payment_unique
  on public.payments (payment_provider, provider_payment_id)
  where provider_payment_id is not null;

comment on column public.payments.tourist_tax_held is
  'Taxe de séjour conservée hors net hôte et hors commission, en centimes, en attente de reversement lorsque la plateforme est collecteur.';
comment on column public.payments.payment_provider is
  'Prestataire ayant traité le paiement voyageur : stripe, lemonway, etc.';
comment on column public.payments.payment_channel is
  'Canal de paiement : card, pay_by_bank, sepa, etc.';
comment on column public.payments.provider_payment_id is
  'Identifiant du paiement chez le PSP, indépendant du fournisseur.';

-- Corrige la documentation historique : dans l'architecture où Escale agit
-- comme intermédiaire de paiement et collecte la taxe, celle-ci ne doit pas
-- être incluse dans le reversement hôte.
comment on column public.reservations.tourist_tax_amount is
  'Montant de taxe de séjour collecté, en centimes. Toujours exclu de l’assiette de commission et isolé du net hôte lorsque la plateforme est collecteur.';
