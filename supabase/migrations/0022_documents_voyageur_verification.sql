-- Symétrique de host_documents (migration 0021), mais volontairement plus
-- restreint : un voyageur ne gère ni bien ni paiement de tiers, seule son
-- identité importe pour limiter la fraude (réservation sous fausse identité,
-- sous-location non autorisée du logement une fois sur place) et enrichir
-- le contrat de location. Bucket PRIVÉ distinct de host-documents, même
-- principe de confidentialité stricte.

create table if not exists public.guest_documents (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.profiles(id) on delete cascade,
  -- Nul par défaut : un document d'identité vaut pour tout le compte, pas
  -- pour une seule réservation. Renseigné seulement si un jour un hôte ou
  -- une réservation à enjeu particulier justifie une pièce dédiée.
  reservation_id uuid references public.reservations(id) on delete set null,

  file_path text not null,          -- chemin dans le bucket privé "guest-documents"
  status document_status not null default 'en_attente', -- réutilise l'enum de la migration 0021

  note_admin text,
  uploaded_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id)
);

create index if not exists idx_guest_documents_guest on public.guest_documents (guest_id);

alter table public.guest_documents enable row level security;

create policy "Le voyageur gère ses propres documents"
  on public.guest_documents for all
  using (guest_id = auth.uid());

-- Comme pour host_documents : aucune policy de lecture pour les autres
-- utilisateurs. La consultation admin passe exclusivement par une route
-- serveur avec la clé service_role (voir app/api/admin/guest-documents).

create or replace view public.guest_verification_status as
select
  guest_id,
  count(*) filter (where status = 'valide') > 0 as identite_verifiee
from public.guest_documents
group by guest_id;

comment on view public.guest_verification_status is
  'Calcule si l''identité d''un voyageur est vérifiée (pièce d''identité validée), sans jamais exposer le contenu du document.';
