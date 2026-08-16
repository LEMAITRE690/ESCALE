-- Vue de reporting automatique : pour chaque conciergerie partenaire, le
-- total des rétrocommissions gagnées, déjà versées, et en attente de
-- versement — recalculée à la volée à chaque lecture, jamais besoin de la
-- maintenir manuellement.

create or replace view public.partner_commission_summary as
select
  p.id as partner_id,
  p.name as partner_name,
  count(pay.id) as reservation_count,
  coalesce(sum(pay.partner_fee), 0) as total_earned,
  coalesce(sum(pay.partner_fee) filter (where pay.partner_transferred_at is not null), 0) as total_transferred,
  coalesce(sum(pay.partner_fee) filter (where pay.partner_transferred_at is null), 0) as total_pending
from public.partners p
left join public.payments pay
  on pay.partner_id = p.id and pay.status = 'succeeded'
group by p.id, p.name;

comment on view public.partner_commission_summary is
  'Agrégat automatique (aucune maintenance manuelle) des rétrocommissions par conciergerie : total gagné, déjà versé, en attente de versement.';
