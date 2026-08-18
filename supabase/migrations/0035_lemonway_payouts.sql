-- Prépare l'automatisation des reversements Lemonway de bout en bout.
-- Les identifiants de Payment Account et d'IBAN sont attribués par Lemonway
-- après onboarding/KYC ; ESCALE ne les invente jamais.

alter table public.profiles
  add column if not exists lemonway_account_id text,
  add column if not exists lemonway_iban_id bigint,
  add column if not exists lemonway_kyc_status integer,
  add column if not exists lemonway_iban_status text,
  add column if not exists lemonway_onboarding_complete boolean not null default false,
  add column if not exists lemonway_payout_enabled boolean not null default false;

alter table public.partners
  add column if not exists lemonway_account_id text,
  add column if not exists lemonway_iban_id bigint,
  add column if not exists lemonway_kyc_status integer,
  add column if not exists lemonway_iban_status text,
  add column if not exists lemonway_onboarding_complete boolean not null default false,
  add column if not exists lemonway_payout_enabled boolean not null default false;

alter table public.payments
  add column if not exists provider_host_transfer_id text,
  add column if not exists provider_partner_transfer_id text,
  add column if not exists provider_platform_transfer_id text,
  add column if not exists provider_tax_transfer_id text,
  add column if not exists provider_host_payout_id text,
  add column if not exists provider_partner_payout_id text,
  add column if not exists payout_last_error text,
  add column if not exists payout_attempted_at timestamptz;

comment on column public.profiles.lemonway_kyc_status is
  'Statut KYC/KYB Lemonway, synchronisé depuis Lemonway. ESCALE ne le force jamais.';
comment on column public.profiles.lemonway_payout_enabled is
  'Vrai uniquement lorsque le Payment Account, le KYC/KYB et l IBAN sont prêts pour un Money-Out.';
comment on column public.payments.provider_host_transfer_id is
  'Identifiant P2P du PSP ayant ventilé le net hôte vers son Payment Account.';
comment on column public.payments.provider_host_payout_id is
  'Identifiant Money-Out du PSP vers le compte bancaire de l hôte.';
