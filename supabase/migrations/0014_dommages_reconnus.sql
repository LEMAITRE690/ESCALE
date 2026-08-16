-- Un même signalement peut couvrir deux situations différentes :
--   - un équipement en panne, sans faute du voyageur (cas déjà géré)
--   - une dégradation dont le voyageur reconnaît spontanément être à l'origine
-- Le champ ci-dessous distingue les deux, sans dupliquer toute la table.

alter table public.equipment_reports
  add column if not exists fault_acknowledged boolean not null default false;

comment on column public.equipment_reports.fault_acknowledged is
  'true si le voyageur déclare lui-même être à l''origine du dommage (dégradation reconnue), false pour une simple panne signalée.';
