-- Empêche deux réservations actives de se chevaucher pour un même logement.
-- La vérification applicative reste utile pour afficher un message convivial,
-- mais la base constitue désormais la dernière barrière atomique contre une
-- double réservation créée par deux requêtes concurrentes.

create extension if not exists btree_gist;

alter table public.reservations
  add constraint reservations_no_active_overlap
  exclude using gist (
    listing_id with =,
    daterange(start_date, end_date, '[)') with &&
  )
  where (status in ('en_attente', 'confirmee'));

comment on constraint reservations_no_active_overlap on public.reservations is
  'Interdit le chevauchement de réservations en attente ou confirmées pour un même logement.';
