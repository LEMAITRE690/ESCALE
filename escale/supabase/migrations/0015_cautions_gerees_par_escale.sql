-- Gestion de la caution PAR Escale (et non plus une simple autorisation
-- gérée directement par l'hôte) : la plateforme autorise le montant sur la
-- carte du voyageur à l'arrivée, le libère automatiquement à la sortie en
-- l'absence de litige, ou le prélève partiellement/totalement en cas de
-- dommage constaté — dans les mêmes conditions que la procédure de
-- médiation déjà en place pour le paiement principal.

create type deposit_status as enum (
  'aucune',              -- pas de caution prévue sur cette annonce
  'carte_enregistree',   -- carte du voyageur mémorisée au paiement, pas encore autorisée
  'autorisee',           -- montant bloqué sur la carte (non prélevé)
  'liberee',             -- autorisation levée sans prélèvement (séjour sans incident)
  'prelevee_partielle',  -- une partie a été prélevée pour dommage constaté
  'prelevee_totale',     -- le montant intégral a été prélevé
  'echec'                -- l'autorisation a échoué (carte refusée, expirée...)
);

alter table public.reservations
  add column if not exists deposit_amount integer,                 -- en centimes
  add column if not exists deposit_customer_id text,                -- client Stripe (carte enregistrée)
  add column if not exists deposit_payment_method_id text,
  add column if not exists deposit_payment_intent_id text,
  add column if not exists deposit_status deposit_status not null default 'aucune',
  add column if not exists deposit_authorized_at timestamptz,
  add column if not exists deposit_captured_amount integer;         -- montant réellement prélevé, en centimes

comment on column public.reservations.deposit_amount is
  'Montant de la caution prévue pour cette réservation (copié de listings.security_deposit au moment de la réservation), en centimes.';
