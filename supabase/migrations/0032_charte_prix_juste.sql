-- Charte du Prix Juste Escale
-- Adhésion déclarative, libre et réversible par l'hôte.
-- Le badge voyageur n'est affiché que lorsque cette valeur est vraie.

alter table public.listings
  add column if not exists fair_price_charter boolean not null default false,
  add column if not exists fair_price_charter_accepted_at timestamptz;

comment on column public.listings.fair_price_charter is
  'L’hôte déclare adhérer à la Charte du Prix Juste Escale et s’engage à proposer, à conditions comparables, un tarif au moins 5 % plus avantageux que sur les plateformes traditionnelles.';

comment on column public.listings.fair_price_charter_accepted_at is
  'Date de la dernière adhésion de l’hôte à la Charte du Prix Juste Escale.';

create or replace function public.set_fair_price_charter_timestamp()
returns trigger
language plpgsql
as $$
begin
  if new.fair_price_charter = true and old.fair_price_charter is distinct from true then
    new.fair_price_charter_accepted_at = now();
  elsif new.fair_price_charter = false then
    new.fair_price_charter_accepted_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_fair_price_charter_timestamp on public.listings;
create trigger listings_fair_price_charter_timestamp
before update of fair_price_charter on public.listings
for each row execute function public.set_fair_price_charter_timestamp();
