-- Ajoute un second type de document voyageur, facultatif : l'attestation
-- d'assurance villégiature (responsabilité civile), qui couvre les dommages
-- que le voyageur pourrait causer pendant son séjour — pratique courante en
-- location saisonnière, complémentaire au dépôt de garantie et au
-- signalement de dommage reconnu déjà en place.
--
-- Contrairement à la pièce d'identité (implicitement obligatoire pour la
-- vérification d'identité), celle-ci est RECOMMANDÉE MAIS FACULTATIVE :
-- son absence ne bloque ni la réservation ni la génération du contrat.

create type guest_document_type as enum ('piece_identite', 'assurance_villegiature');

alter table public.guest_documents
  add column if not exists document_type guest_document_type not null default 'piece_identite';

-- La contrainte d'unicité par défaut de Postgres ne s'applique pas ici
-- (aucune contrainte unique n'existait sur guest_id seul), donc un voyageur
-- peut avoir une ligne par type sans conflit : rien à ajuster sur ce point.

-- La vue de vérification d'identité ne doit porter que sur la pièce
-- d'identité — l'assurance, facultative, ne doit jamais entrer dans son
-- calcul.
create or replace view public.guest_verification_status as
select
  guest_id,
  count(*) filter (where document_type = 'piece_identite' and status = 'valide') > 0 as identite_verifiee,
  count(*) filter (where document_type = 'assurance_villegiature' and status = 'valide') > 0 as assurance_fournie
from public.guest_documents
group by guest_id;

comment on view public.guest_verification_status is
  'Calcule si l''identité du voyageur est vérifiée (pièce d''identité validée) et s''il a fourni une attestation d''assurance villégiature (facultative), sans jamais exposer le contenu des documents.';
