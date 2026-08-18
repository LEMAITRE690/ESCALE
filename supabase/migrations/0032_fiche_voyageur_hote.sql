-- Fiche voyageur enrichie côté hôte : première brique d'un CRM de
-- fidélisation.
--
-- Deux objets : les notes privées que l'hôte prend sur un voyageur, et un
-- agrégat de l'historique de ce voyageur chez cet hôte.
--
-- Cloisonnement : un hôte ne voit que les voyageurs ayant réservé dans ses
-- propres annonces. La règle est portée par les policies RLS, jamais par le
-- seul code applicatif.

create table if not exists public.host_guest_notes (
  host_id    uuid not null references public.profiles(id) on delete cascade,
  guest_id   uuid not null references public.profiles(id) on delete cascade,
  note       text not null default '',
  updated_at timestamptz not null default now(),

  primary key (host_id, guest_id)
);

comment on table public.host_guest_notes is
  'Notes privées d''un hôte sur un voyageur. Jamais visibles du voyageur '
  'concerné ni des autres hôtes.';

create or replace function public.toucher_host_guest_note()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_host_guest_note_update on public.host_guest_notes;
create trigger on_host_guest_note_update
  before update on public.host_guest_notes
  for each row execute function public.toucher_host_guest_note();

-- Un voyageur a-t-il séjourné chez cet hôte ? Sert aux policies comme aux
-- routes : la définition du lien hôte/voyageur ne doit exister qu'une fois.
create or replace function public.voyageur_de_l_hote(p_host_id uuid, p_guest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.reservations r
      join public.listings l on l.id = r.listing_id
     where l.host_id = p_host_id
       and r.guest_id = p_guest_id
       and r.status in ('confirmee', 'terminee')
  );
$$;

-- Agrégat par (hôte, voyageur). Les avis et les logements sont calculés en
-- sous-requêtes plutôt qu'en jointures : une jointure directe multiplierait
-- les lignes de réservation et fausserait le total dépensé.
create or replace view public.host_guest_summary as
select
  l.host_id,
  r.guest_id,
  count(*)                                   as nb_sejours,
  min(r.start_date)                          as premier_sejour,
  max(r.start_date)                          as dernier_sejour,
  sum(r.amount_total)                        as total_depense,
  sum(r.guests)                              as total_voyageurs,
  round(avg(r.end_date - r.start_date), 1)   as duree_moyenne_nuits,
  count(*) filter (where r.with_pet)         as sejours_avec_animal,
  array_agg(distinct l.title order by l.title) as logements,
  (
    select round(avg(av.rating), 2)
      from public.reviews av
      join public.listings al on al.id = av.listing_id
     where av.guest_id = r.guest_id
       and al.host_id = l.host_id
  )                                          as note_moyenne_laissee,
  (
    select count(*)
      from public.reviews av
      join public.listings al on al.id = av.listing_id
     where av.guest_id = r.guest_id
       and al.host_id = l.host_id
  )                                          as nb_avis_laisses
from public.reservations r
join public.listings l on l.id = r.listing_id
where r.guest_id is not null
  and r.status in ('confirmee', 'terminee')
group by l.host_id, r.guest_id;

comment on view public.host_guest_summary is
  'Historique agrégé de chaque voyageur chez un hôte donné : séjours, '
  'dates extrêmes, montant dépensé, logements réservés et avis laissés. '
  'Seules les réservations confirmées ou terminées sont comptées.';

alter table public.host_guest_notes enable row level security;

-- L'hôte gère ses propres notes, et uniquement sur des voyageurs qui ont
-- effectivement séjourné chez lui : sans cette seconde condition, il pourrait
-- créer une fiche sur n'importe quel compte de la plateforme.
drop policy if exists "L'hôte gère ses notes sur ses voyageurs" on public.host_guest_notes;
create policy "L'hôte gère ses notes sur ses voyageurs"
  on public.host_guest_notes for all
  using (host_id = auth.uid() and public.voyageur_de_l_hote(auth.uid(), guest_id))
  with check (host_id = auth.uid() and public.voyageur_de_l_hote(auth.uid(), guest_id));
