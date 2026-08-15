-- Documents que l'hôte doit fournir avant publication effective d'une
-- annonce, pour limiter les fausses annonces et fiabiliser les contrats
-- générés (voir lib/contracts/generateContract.ts). Stockés dans un bucket
-- PRIVÉ (contrairement aux photos de logement, publiques) : seuls l'hôte
-- concerné et un administrateur peuvent y accéder, via URL signée.

create type document_type as enum (
  'piece_identite',            -- carte d'identité ou passeport de l'hôte
  'justificatif_domicile',     -- moins de 3 mois
  'titre_propriete_ou_mandat', -- propriété du logement ou mandat de gestion (conciergerie)
  'attestation_assurance'      -- habitation + clause villégiature, ou PNO
);

create type document_status as enum ('en_attente', 'valide', 'refuse');

create table if not exists public.host_documents (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  -- Nul pour un document valable pour tout le compte (pièce d'identité,
  -- justificatif de domicile) ; renseigné pour un document propre à un
  -- logement (titre de propriété/mandat, assurance).
  listing_id uuid references public.listings(id) on delete cascade,

  document_type document_type not null,
  file_path text not null,          -- chemin dans le bucket privé "host-documents"
  status document_status not null default 'en_attente',

  note_admin text,                  -- motif en cas de refus
  uploaded_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id)
);

create index if not exists idx_host_documents_host on public.host_documents (host_id, document_type);

alter table public.host_documents enable row level security;

create policy "L'hôte gère ses propres documents"
  on public.host_documents for all
  using (host_id = auth.uid());

-- Pas de policy de lecture pour les autres utilisateurs : la consultation
-- par un administrateur passe exclusivement par une route serveur avec la
-- clé service_role (voir app/api/admin/documents), jamais par une requête
-- client directe — ces documents ne doivent jamais être exposés côté client
-- au-delà de leur propriétaire.

-- Vue pratique : statut de vérification global d'un hôte, calculée à la
-- volée à partir de ses documents "de compte" (identité + domicile), utile
-- pour afficher un badge "Identité vérifiée" sans exposer aucun document.
create or replace view public.host_verification_status as
select
  host_id,
  (count(*) filter (where document_type = 'piece_identite' and status = 'valide') > 0)
    and (count(*) filter (where document_type = 'justificatif_domicile' and status = 'valide') > 0)
    as identite_verifiee,
  count(*) filter (where document_type = 'piece_identite' and status = 'valide') > 0 as piece_identite_validee,
  count(*) filter (where document_type = 'justificatif_domicile' and status = 'valide') > 0 as domicile_valide
from public.host_documents
group by host_id;

comment on view public.host_verification_status is
  'Calcule si l''identité d''un hôte est vérifiée (pièce d''identité + justificatif de domicile validés), sans jamais exposer le contenu des documents eux-mêmes.';
