-- Récapitulatif mensuel des transactions d'une conciergerie partenaire.
--
-- Les conciergeries disposant d'un accès super-hôte établissent elles-mêmes
-- leur facture de rétrocommission à destination d'Escale : Escale ne leur
-- émet donc pas de facture, mais leur fournit le détail mensuel des
-- transactions sur lequel appuyer cette facturation.
--
-- Agrégat recalculé à la lecture, sur le modèle de partner_commission_summary
-- (migration 0019) : aucune maintenance, aucune donnée dupliquée.

create or replace view public.partner_monthly_summary as
select
  pay.partner_id,
  date_trunc('month', pay.created_at)::date as mois,
  count(*)                                                  as reservation_count,
  coalesce(sum(pay.amount_total), 0)                        as volume_transactions,
  coalesce(sum(pay.partner_fee), 0)                         as retrocommission,
  coalesce(sum(pay.partner_fee)
    filter (where pay.partner_transferred_at is not null), 0) as retrocommission_versee,
  coalesce(sum(pay.partner_fee)
    filter (where pay.partner_transferred_at is null), 0)     as retrocommission_en_attente
from public.payments pay
where pay.status = 'succeeded'
  and pay.partner_id is not null
group by pay.partner_id, date_trunc('month', pay.created_at);

comment on view public.partner_monthly_summary is
  'Récapitulatif mensuel par conciergerie : nombre de transactions, volume '
  'encaissé auprès des voyageurs, et rétrocommission gagnée, versée ou en '
  'attente. Sert de base à la facture que la conciergerie établit elle-même.';

-- Le regroupement par (partenaire, mois) parcourait jusqu'ici l'index
-- idx_payments_to_release, construit sur (status, transferred_at).
create index if not exists idx_payments_partner_mois
  on public.payments (partner_id, created_at)
  where partner_id is not null;
