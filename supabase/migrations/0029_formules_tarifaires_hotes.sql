-- Formules tarifaires des hôtes : Commission (8,5 % TTC) ou Abonnement
-- (19 €/mois TTC + 5 % TTC par réservation).
--
-- Choix de conception : la formule est historisée par périodes plutôt que
-- stockée dans une colonne d'état. Le taux appliqué à une réservation doit
-- refléter la formule en vigueur à la date de début du séjour, pas la formule
-- courante de l'hôte — une simple colonne ne permettrait pas de répondre à
-- « quelle formule au 12 juillet ? » une fois l'hôte passé à autre chose.
--
-- Un changement de formule à venir n'est pas un état particulier : c'est une
-- période dont effective_from est dans le futur. Rien à déclencher au moment
-- venu, la lecture par date suffit.

create extension if not exists btree_gist;

do $$ begin
  create type pricing_plan as enum ('commission', 'abonnement');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.host_pricing_plans (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references public.profiles(id) on delete cascade,
  plan           pricing_plan not null,
  effective_from timestamptz not null,
  effective_to   timestamptz,          -- null = période ouverte
  -- souscription | changement | echec_paiement | resiliation
  cause          text not null,
  created_at     timestamptz not null default now(),

  constraint periode_coherente
    check (effective_to is null or effective_to > effective_from),

  -- Deux périodes ne peuvent pas se chevaucher pour un même hôte. La règle est
  -- tenue par la base et non par le code applicatif, sur le même principe que
  -- l'anti-double-réservation de la table reservations.
  constraint periodes_sans_chevauchement exclude using gist (
    host_id with =,
    tstzrange(effective_from, coalesce(effective_to, 'infinity')) with &&
  )
);

comment on table public.host_pricing_plans is
  'Historique des formules tarifaires par hôte. Source de vérité : la formule '
  'active et un éventuel changement en attente s''en déduisent, ils ne sont '
  'stockés nulle part ailleurs.';

comment on column public.host_pricing_plans.cause is
  'Origine du changement, à des fins de support : souscription, changement '
  'demandé par l''hôte, échec de prélèvement, ou résiliation.';

create index if not exists idx_host_pricing_plans_lookup
  on public.host_pricing_plans (host_id, effective_from desc);

-- État Stripe courant : les seules données de l'abonnement qui n'ont pas
-- d'historique métier propre.
alter table public.profiles
  -- Distinct de stripe_account_id, qui est le compte Connect de VERSEMENT :
  -- celui-ci sert à PRÉLEVER l'hôte au titre de son abonnement.
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_id text,
  -- trialing | active | past_due | unpaid | canceled
  add column if not exists subscription_status text,
  add column if not exists subscription_current_period_end timestamptz;

-- Traçabilité comptable : on fige sur le paiement la formule et le taux
-- réellement appliqués, pour qu'une facture reste explicable des années plus
-- tard sans rejouer l'historique.
alter table public.payments
  add column if not exists pricing_plan pricing_plan,
  add column if not exists commission_rate_applied numeric(5,4);

-- Formule applicable à une date donnée. Un hôte sans aucune période
-- enregistrée relève de la formule Commission, qui reste la formule de base.
create or replace function public.formule_hote_a(p_host_id uuid, p_date timestamptz)
returns pricing_plan
language sql
stable
as $$
  select coalesce(
    (
      select plan
        from public.host_pricing_plans
       where host_id = p_host_id
         and effective_from <= p_date
         and (effective_to is null or effective_to > p_date)
       limit 1
    ),
    'commission'::pricing_plan
  );
$$;

-- Bascule d'un hôte vers une formule à une date donnée : clôture la période
-- ouverte et en ouvre une nouvelle, en une seule opération atomique.
--
-- Idempotente sur le cas courant : si la période en vigueur à cette date porte
-- déjà la formule demandée, rien n'est écrit. Un webhook Stripe rejoué ne crée
-- donc pas de période parasite.
create or replace function public.basculer_formule_hote(
  p_host_id   uuid,
  p_plan      pricing_plan,
  p_effective timestamptz,
  p_cause     text
)
returns public.host_pricing_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courante public.host_pricing_plans%rowtype;
  v_nouvelle public.host_pricing_plans%rowtype;
  -- FOUND est réaffecté par chaque instruction : il est capturé ici, avant le
  -- DELETE qui suit, sans quoi la clôture de la période en cours dépendrait du
  -- résultat de cette suppression.
  v_periode_en_cours boolean;
begin
  select * into v_courante
    from public.host_pricing_plans
   where host_id = p_host_id
     and effective_from <= p_effective
     and (effective_to is null or effective_to > p_effective)
   limit 1;

  v_periode_en_cours := found;

  if v_periode_en_cours and v_courante.plan = p_plan then
    return v_courante;
  end if;

  -- Toute période future devient caduque : un changement décidé maintenant
  -- prime sur un changement programmé plus tard.
  delete from public.host_pricing_plans
   where host_id = p_host_id and effective_from > p_effective;

  if v_periode_en_cours then
    update public.host_pricing_plans
       set effective_to = p_effective
     where id = v_courante.id;
  end if;

  insert into public.host_pricing_plans (host_id, plan, effective_from, cause)
  values (p_host_id, p_plan, p_effective, p_cause)
  returning * into v_nouvelle;

  return v_nouvelle;
end;
$$;

-- Vue de confort pour l'espace hôte : formule active, changement en attente
-- et état de l'abonnement, sans dupliquer la moindre donnée.
create or replace view public.host_pricing_state as
select
  p.id                                      as host_id,
  public.formule_hote_a(p.id, now())        as formule_active,
  f.plan                                    as formule_en_attente,
  f.effective_from                          as prise_effet_en_attente,
  p.subscription_id,
  p.subscription_status,
  p.subscription_current_period_end
from public.profiles p
left join lateral (
  select plan, effective_from
    from public.host_pricing_plans
   where host_id = p.id
     and effective_from > now()
   order by effective_from
   limit 1
) f on true;

comment on view public.host_pricing_state is
  'Formule active, changement en attente et état d''abonnement d''un hôte. '
  'Entièrement dérivée de host_pricing_plans et profiles : aucune '
  'resynchronisation à maintenir.';

alter table public.host_pricing_plans enable row level security;

drop policy if exists "Hôte consulte son historique de formules" on public.host_pricing_plans;
create policy "Hôte consulte son historique de formules"
  on public.host_pricing_plans for select
  using (host_id = auth.uid());

-- Aucune policy d'écriture : les bascules passent exclusivement par
-- basculer_formule_hote(), appelée depuis les routes serveur avec la clé
-- service_role. Un hôte ne réécrit pas son propre historique tarifaire.
