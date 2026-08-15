-- Un hôte principal peut inviter un ou plusieurs co-hôtes sur ses annonces,
-- avec un niveau d'accès différent selon la confiance accordée : quelqu'un
-- qui gère le ménage n'a pas besoin de voir les revenus, quelqu'un qui
-- répond aux voyageurs n'a pas forcément besoin de modifier l'annonce.

create type co_host_level as enum ('gestion_complete', 'operationnel', 'messagerie_seule');
create type co_host_status as enum ('invite', 'actif', 'revoque');

create table if not exists public.co_hosts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  host_id uuid not null references public.profiles(id),        -- l'hôte principal, qui a invité
  co_host_id uuid references public.profiles(id),               -- rempli une fois l'invitation acceptée
  co_host_email text not null,                                  -- utilisé pour l'invitation avant inscription

  level co_host_level not null default 'operationnel',
  -- Permissions dérivées du niveau à la création, mais modifiables
  -- individuellement ensuite pour un accès sur-mesure.
  can_edit_listing boolean not null default false,     -- modifier annonce, photos, tarifs
  can_manage_calendar boolean not null default true,   -- bloquer/débloquer des dates
  can_manage_reservations boolean not null default true, -- voir et gérer les réservations
  can_reply_messages boolean not null default true,    -- répondre aux voyageurs
  can_view_finances boolean not null default false,    -- voir les revenus et paiements

  status co_host_status not null default 'invite',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,

  unique (listing_id, co_host_email)
);

create index if not exists idx_co_hosts_listing on public.co_hosts (listing_id);
create index if not exists idx_co_hosts_co_host on public.co_hosts (co_host_id);

alter table public.co_hosts enable row level security;

create policy "L'hôte principal gère ses co-hôtes"
  on public.co_hosts for all
  using (host_id = auth.uid());

create policy "Le co-hôte voit ses propres accès"
  on public.co_hosts for select
  using (co_host_id = auth.uid());

-- Étend l'accès aux annonces et réservations aux co-hôtes actifs, selon
-- leurs permissions — en plus (jamais à la place) des policies existantes
-- réservées à l'hôte principal.
create policy "Le co-hôte consulte les annonces où il a un accès actif"
  on public.listings for select
  using (
    id in (
      select listing_id from public.co_hosts
      where co_host_id = auth.uid() and status = 'actif'
    )
  );

create policy "Le co-hôte modifie l'annonce s'il a la permission"
  on public.listings for update
  using (
    id in (
      select listing_id from public.co_hosts
      where co_host_id = auth.uid() and status = 'actif' and can_edit_listing = true
    )
  );

create policy "Le co-hôte consulte les réservations s'il a la permission"
  on public.reservations for select
  using (
    listing_id in (
      select listing_id from public.co_hosts
      where co_host_id = auth.uid() and status = 'actif' and can_manage_reservations = true
    )
  );

-- Remarque : le co-hôte n'a jamais accès aux routes de paiement (Stripe
-- Connect, reversements) même avec can_view_finances = true — ce champ ne
-- conditionne que l'affichage en lecture dans le tableau de bord, jamais
-- la capacité à initier un virement ou modifier les coordonnées bancaires
-- de l'hôte principal.
