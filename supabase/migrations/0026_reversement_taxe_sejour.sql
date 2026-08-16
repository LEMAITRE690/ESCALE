-- Le reversement de la taxe de séjour se fait par commune, deux fois par an
-- (30 juin et 31 décembre — Article L2333-34 du CGCT), auprès du comptable
-- public de chaque collectivité. Aucune API unifiée n'existe pour payer les
-- ~35 000 communes françaises : cette table sert à AGRÉGER ce qui est dû,
-- pas à automatiser le virement lui-même, qui reste une opération manuelle
-- (ou via FARITAS pour la seule partie déclarative, sur convention DGFiP).

create table if not exists public.tourist_tax_remittances (
  id uuid primary key default gen_random_uuid(),
  commune text not null,
  semestre text not null,            -- ex: "2026-S1" (janvier-juin), "2026-S2" (juillet-décembre)
  period_start date not null,
  period_end date not null,

  amount_due integer not null,       -- en centimes, agrégé depuis reservations.tourist_tax_amount
  reservation_count integer not null default 0,

  status text not null default 'a_verser',  -- a_verser | verse
  remitted_at timestamptz,
  note text,

  updated_at timestamptz not null default now(),
  unique (commune, semestre)
);

alter table public.tourist_tax_remittances enable row level security;

-- Aucune policy client : consultation et mise à jour exclusivement via des
-- routes admin (clé service_role), jamais directement par un hôte ou un
-- voyageur — ces montants concernent la relation Escale/collectivités, pas
-- une donnée utilisateur.

comment on table public.tourist_tax_remittances is
  'Agrégat par commune et par semestre de la taxe de séjour collectée, pour préparer le reversement légal aux collectivités (Article L2333-34 CGCT) — ne déclenche aucun virement automatique.';
