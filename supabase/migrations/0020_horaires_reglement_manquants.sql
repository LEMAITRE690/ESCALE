-- Ces champs sont collectés par le formulaire de publication depuis un
-- moment déjà (horaires standards, règlement intérieur, équipements hors
-- liste fermée), mais la table `listings` n'avait jamais les colonnes
-- correspondantes : la route de création les recevait sans les persister.
-- Corrige cet oubli.

alter table public.listings
  add column if not exists checkin_time text,          -- horaire standard d'arrivée, ex: "15:00"
  add column if not exists checkout_time text,          -- horaire standard de départ, ex: "11:00"
  add column if not exists house_rules text,            -- règlement intérieur en texte libre
  add column if not exists extra_amenities jsonb not null default '[]'::jsonb; -- équipements hors liste fermée
