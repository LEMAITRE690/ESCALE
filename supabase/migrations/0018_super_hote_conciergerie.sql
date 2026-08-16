-- Une conciergerie ne gère généralement pas une seule annonce mais tout le
-- portefeuille d'un hôte : plutôt que de l'inviter annonce par annonce comme
-- un co-hôte classique (table co_hosts), elle reçoit un statut "super-hôte"
-- qui couvre automatiquement TOUTES les annonces de l'hôte qui l'a rattachée.
--
-- Point non négociable : ce statut ne modifie jamais listings.host_id.
-- L'hôte reste propriétaire de son annonce même s'il cesse de travailler
-- avec la conciergerie — il lui suffit de révoquer l'accès (Article ci-dessous)
-- pour que la conciergerie perde immédiatement toute visibilité, sans que
-- l'annonce ne soit jamais transférée ni affectée.

-- Compte de connexion de la conciergerie (celui qui se connecte à Escale
-- pour gérer les annonces des hôtes qui l'ont rattachée).
alter table public.partners
  add column if not exists owner_user_id uuid references public.profiles(id);

create table if not exists public.partner_host_grants (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,

  status text not null default 'actif',   -- actif | revoque
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,

  unique (partner_id, host_id)
);

create index if not exists idx_partner_grants_host on public.partner_host_grants (host_id, status);

alter table public.partner_host_grants enable row level security;

create policy "L'hôte gère les accès qu'il accorde à ses conciergeries"
  on public.partner_host_grants for all
  using (host_id = auth.uid());

create policy "La conciergerie voit les accès qui lui ont été accordés"
  on public.partner_host_grants for select
  using (
    partner_id in (select id from public.partners where owner_user_id = auth.uid())
  );

-- Étend l'accès "super-hôte" aux annonces et réservations, en plus (jamais
-- à la place) des policies existantes de l'hôte principal et des co-hôtes.
create policy "La conciergerie consulte les annonces des hôtes qui l'ont autorisée"
  on public.listings for select
  using (
    host_id in (
      select g.host_id from public.partner_host_grants g
      join public.partners p on p.id = g.partner_id
      where p.owner_user_id = auth.uid() and g.status = 'actif'
    )
  );

create policy "La conciergerie modifie les annonces des hôtes qui l'ont autorisée"
  on public.listings for update
  using (
    host_id in (
      select g.host_id from public.partner_host_grants g
      join public.partners p on p.id = g.partner_id
      where p.owner_user_id = auth.uid() and g.status = 'actif'
    )
  );

create policy "La conciergerie consulte les réservations des hôtes qui l'ont autorisée"
  on public.reservations for select
  using (
    listing_id in (
      select l.id from public.listings l
      join public.partner_host_grants g on g.host_id = l.host_id
      join public.partners p on p.id = g.partner_id
      where p.owner_user_id = auth.uid() and g.status = 'actif'
    )
  );

-- Garde-fou : personne d'autre que l'hôte lui-même ne peut changer le
-- propriétaire d'une annonce via une session authentifiée classique — ni un
-- co-hôte "gestion complète", ni une conciergerie "super-hôte", quel que
-- soit leur niveau d'accès. C'est la traduction technique du principe
-- énoncé plus haut. (Les routes serveur utilisant la clé service_role,
-- réservées à l'administration d'Escale, ne passent pas par une session
-- utilisateur et ne sont donc pas concernées par ce garde-fou : c'est un
-- choix délibéré, propre à toute clé service_role vis-à-vis des policies
-- RLS de Postgres, pas une faille de ce trigger en particulier.)
create or replace function public.prevent_listing_ownership_transfer()
returns trigger as $$
begin
  if new.host_id <> old.host_id and auth.uid() <> old.host_id then
    raise exception 'Seul l''hôte propriétaire peut transférer la propriété de son annonce.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_listing_ownership_change on public.listings;
create trigger on_listing_ownership_change
  before update on public.listings
  for each row execute function public.prevent_listing_ownership_transfer();
