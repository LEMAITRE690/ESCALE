-- Identité légale des conciergeries partenaires.
--
-- Nécessaire pour établir le contrat d'apporteur d'affaires : jusqu'ici la
-- table partners ne portait qu'un nom commercial et un e-mail, insuffisants
-- pour identifier une partie à un contrat.
--
-- Saisie par un administrateur Escale, jamais par la conciergerie elle-même :
-- aucune policy d'écriture n'est ouverte, les mises à jour passent par les
-- routes serveur avec la clé service_role.

alter table public.partners
  -- Identification de la personne morale
  add column if not exists legal_name         text,   -- dénomination sociale, distincte du nom commercial
  add column if not exists legal_form         text,   -- SAS, SARL, EI...
  add column if not exists siret              text,
  add column if not exists rcs                text,   -- ville et numéro d'immatriculation
  add column if not exists share_capital      numeric(12,2),  -- en euros ; nul pour une entreprise individuelle
  add column if not exists registered_address text,

  -- Régime de TVA : conditionne la facturation de la rétrocommission
  add column if not exists vat_regime         text,   -- assujettie | franchise_en_base
  add column if not exists vat_number         text,   -- exigé si assujettie

  -- Signataire du contrat. Le mobile est indispensable à la signature
  -- électronique avancée, dont l'authentification passe par SMS.
  add column if not exists legal_rep_name     text,
  add column if not exists legal_rep_role     text,   -- gérant, président...
  add column if not exists legal_rep_email    text,
  add column if not exists legal_rep_phone    text;

do $$ begin
  alter table public.partners
    add constraint vat_regime_valide
    check (vat_regime is null or vat_regime in ('assujettie', 'franchise_en_base'));
exception
  when duplicate_object then null;
end $$;

comment on column public.partners.legal_name is
  'Dénomination sociale. La colonne name reste le nom commercial affiché dans '
  'l''application ; les deux peuvent différer.';

comment on column public.partners.legal_rep_phone is
  'Mobile du signataire, au format international. Requis par la signature '
  'électronique avancée avec authentification par SMS.';

-- Complétude de la fiche : condition d'octroi du statut super-hôte.
--
-- Le capital social est volontairement facultatif — une entreprise
-- individuelle n'en a pas. Le numéro de TVA n'est exigé que des assujetties.
create or replace function public.partenaire_fiche_complete(p_partner_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select
        nullif(btrim(p.legal_name), '')         is not null
        and nullif(btrim(p.legal_form), '')     is not null
        and nullif(btrim(p.siret), '')          is not null
        and nullif(btrim(p.registered_address), '') is not null
        and p.vat_regime                        is not null
        and (p.vat_regime <> 'assujettie' or nullif(btrim(p.vat_number), '') is not null)
        and nullif(btrim(p.legal_rep_name), '') is not null
        and nullif(btrim(p.legal_rep_role), '') is not null
        and nullif(btrim(p.legal_rep_phone), '') is not null
      from public.partners p
      where p.id = p_partner_id
    ),
    false
  );
$$;

-- Garde-fou : pas de statut super-hôte sans fiche complète.
--
-- Placé en base plutôt que dans la route /api/partners/attach, parce que
-- l'octroi peut aussi naître d'une écriture directe de l'hôte : la policy
-- « L'hôte gère les accès qu'il accorde à ses conciergeries » (migration
-- 0018) autorise un insert depuis le client.
create or replace function public.exiger_fiche_conciergerie_complete()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'actif' and not public.partenaire_fiche_complete(new.partner_id) then
    raise exception
      'Statut super-hôte refusé : la fiche légale de cette conciergerie est incomplète.'
      using hint = 'Un administrateur Escale doit compléter dénomination, forme juridique, SIRET, adresse, régime de TVA et signataire.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_partner_host_grant_fiche on public.partner_host_grants;
create trigger on_partner_host_grant_fiche
  before insert or update of status on public.partner_host_grants
  for each row execute function public.exiger_fiche_conciergerie_complete();

-- Vue d'administration : l'état de complétude sans réécrire le test partout.
create or replace view public.partner_legal_status as
select
  p.id as partner_id,
  p.name,
  p.legal_name,
  p.status,
  public.partenaire_fiche_complete(p.id) as fiche_complete,
  (select count(*) from public.partner_host_grants g
    where g.partner_id = p.id and g.status = 'actif') as hotes_actifs
from public.partners p;

comment on view public.partner_legal_status is
  'État de complétude de la fiche légale de chaque conciergerie, et nombre '
  'd''hôtes lui ayant accordé le statut super-hôte.';
