-- Coordonnées géographiques pour la recherche cartographique.
alter table public.listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.listings
  drop constraint if exists listings_latitude_range,
  add constraint listings_latitude_range check (latitude is null or latitude between -90 and 90),
  drop constraint if exists listings_longitude_range,
  add constraint listings_longitude_range check (longitude is null or longitude between -180 and 180);

create index if not exists idx_listings_geo
  on public.listings (latitude, longitude)
  where status = 'actif' and latitude is not null and longitude is not null;
