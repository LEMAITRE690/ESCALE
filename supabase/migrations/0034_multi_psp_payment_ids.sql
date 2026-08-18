-- Le champ Stripe historique ne peut plus être obligatoire : les paiements
-- Lemonway n'ont pas de PaymentIntent Stripe. provider_payment_id devient la
-- référence canonique multi-PSP (migration 0033).

alter table public.payments
  alter column stripe_payment_intent_id drop not null;

comment on column public.payments.stripe_payment_intent_id is
  'Identifiant Stripe uniquement pour les paiements traités par Stripe. NULL pour les autres PSP.';
