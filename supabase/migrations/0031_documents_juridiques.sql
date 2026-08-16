-- Documents juridiques versionnés et traçabilité de leur acceptation.
--
-- Une acceptation ne vaut que si l'on peut produire, des années après, le
-- texte exact qui a été coché. Un document rendu depuis du code peut être
-- modifié sans que personne ne s'en aperçoive : le texte est donc figé en
-- base, et une version déjà acceptée devient immuable.
--
-- Le type 'cgl' est prévu dès maintenant, son intégration au tunnel de
-- réservation étant traitée séparément.
--
-- Les CGU sont figées ici comme les autres documents. Leur texte est composé
-- par lib/legal/cgu.mjs, qui interpole les taux au moment de la publication :
-- une version publiée ne bouge plus, et un changement de grille tarifaire
-- impose d''en publier une nouvelle.

do $$ begin
  create type legal_document_type as enum ('cgu', 'cgv_hotes', 'cgl');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.legal_documents (
  id             uuid primary key default gen_random_uuid(),
  type           legal_document_type not null,
  version        text not null,
  title          text not null,
  content        text not null,             -- texte intégral, en markdown
  content_hash   text not null,             -- sha256, preuve d'intégrité
  effective_from timestamptz not null,
  published_at   timestamptz not null default now(),
  created_at     timestamptz not null default now(),

  constraint version_unique_par_type unique (type, version),
  -- Référencé par la clé étrangère composite de legal_acceptances, qui
  -- contraint la présence d'une réservation selon le type de document.
  constraint document_identifie_par_type unique (id, type)
);

comment on table public.legal_documents is
  'Versions successives des documents juridiques. Le texte est figé : une '
  'version déjà acceptée ne peut plus être modifiée.';

create index if not exists idx_legal_documents_en_vigueur
  on public.legal_documents (type, effective_from desc);

create table if not exists public.legal_acceptances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,

  document_id   uuid not null,
  document_type legal_document_type not null,

  -- Propre à chaque réservation pour les CGL, interdit pour les autres :
  -- une nouvelle version des CGL ne rétroagit donc pas sur les séjours
  -- déjà réservés.
  reservation_id uuid references public.reservations(id) on delete cascade,

  accepted_at   timestamptz not null default now(),
  ip_address    inet,
  user_agent    text,

  constraint document_accepte_coherent
    foreign key (document_id, document_type)
    references public.legal_documents (id, type),

  constraint cgl_liee_a_une_reservation check (
    (document_type = 'cgl') = (reservation_id is not null)
  )
);

comment on table public.legal_acceptances is
  'Trace des acceptations : utilisateur, version acceptée, horodatage, IP et '
  'navigateur. Aucune modification ni suppression n''est prévue.';

-- Une acceptation par utilisateur et par version pour les documents globaux…
create unique index if not exists legal_acceptances_globales
  on public.legal_acceptances (user_id, document_id)
  where reservation_id is null;

-- …et une par réservation pour les CGL.
create unique index if not exists legal_acceptances_cgl
  on public.legal_acceptances (reservation_id, document_id)
  where reservation_id is not null;

create index if not exists idx_legal_acceptances_utilisateur
  on public.legal_acceptances (user_id, document_type, accepted_at desc);

-- Version en vigueur d'un type : la plus récente déjà entrée en vigueur.
create or replace view public.legal_documents_en_vigueur as
select distinct on (type) *
from public.legal_documents
where effective_from <= now()
order by type, effective_from desc;

-- Immuabilité : un texte accepté ne doit pas changer sous les pieds de celui
-- qui l'a coché. Une version non encore acceptée reste corrigeable.
create or replace function public.figer_document_accepte()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.legal_acceptances where document_id = old.id) then
    if new.content <> old.content
       or new.version <> old.version
       or new.effective_from <> old.effective_from
       or new.type <> old.type then
      raise exception
        'Cette version a déjà été acceptée : son texte ne peut plus être modifié.'
        using hint = 'Publiez une nouvelle version plutôt que de corriger celle-ci.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_legal_document_update on public.legal_documents;
create trigger on_legal_document_update
  before update on public.legal_documents
  for each row execute function public.figer_document_accepte();

create or replace function public.interdire_suppression_document_accepte()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.legal_acceptances where document_id = old.id) then
    raise exception 'Cette version a déjà été acceptée : elle ne peut pas être supprimée.';
  end if;
  return old;
end;
$$;

drop trigger if exists on_legal_document_delete on public.legal_documents;
create trigger on_legal_document_delete
  before delete on public.legal_documents
  for each row execute function public.interdire_suppression_document_accepte();

-- L'utilisateur a-t-il accepté la version actuellement en vigueur ?
-- Utilisée pour bloquer la gestion d'annonces après une mise à jour du texte.
create or replace function public.a_accepte_version_en_vigueur(
  p_user_id uuid,
  p_type    legal_document_type
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
      from public.legal_acceptances a
      join public.legal_documents_en_vigueur d on d.id = a.document_id
     where a.user_id = p_user_id
       and d.type = p_type
       and a.reservation_id is null
  );
$$;

alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;

drop policy if exists "Documents juridiques lisibles par tous" on public.legal_documents;
create policy "Documents juridiques lisibles par tous"
  on public.legal_documents for select
  using (true);

drop policy if exists "Chacun consulte ses propres acceptations" on public.legal_acceptances;
create policy "Chacun consulte ses propres acceptations"
  on public.legal_acceptances for select
  using (user_id = auth.uid());

-- Aucune policy d'écriture : la publication d'une version comme
-- l'enregistrement d'une acceptation passent par des routes serveur, seules
-- à pouvoir relever l'adresse IP et le navigateur de façon fiable.
