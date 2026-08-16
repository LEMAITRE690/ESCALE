-- La taxe de séjour est perçue par l'hôte pour le compte de la commune où
-- se situe le logement (article L2333-26 et suivants du CGCT) : elle ne
-- constitue jamais un revenu pour l'hôte ni pour Escale, et ne doit donc
-- jamais entrer dans l'assiette de la commission plateforme (voir
-- lib/stripe/client.ts, computeFees).
--
-- Le taux applicable varie par commune et par catégorie de logement — Escale
-- ne peut pas le déterminer automatiquement pour toute la France : c'est
-- l'hôte qui le renseigne, comme le montant à payer à sa mairie ou trouvé
-- sur https://www.collectivites-locales.gouv.fr.

alter table public.listings
  add column if not exists tourist_tax_enabled boolean not null default false,
  add column if not exists tourist_tax_per_person_per_night numeric(6,2); -- en euros

alter table public.reservations
  add column if not exists tourist_tax_amount integer,           -- montant collecté, en centimes
  add column if not exists tourist_tax_exempt_guests integer not null default 0; -- voyageurs de moins de 18 ans, exonérés

comment on column public.listings.tourist_tax_per_person_per_night is
  'Taux renseigné par l''hôte, propre à sa commune et à la catégorie de son logement — jamais calculé automatiquement par Escale.';
comment on column public.reservations.tourist_tax_amount is
  'Montant collecté pour le compte de la commune, en centimes — exclu de l''assiette de la commission Escale (voir computeFees) et intégralement reversé à l''hôte, qui reste responsable de sa déclaration/du versement à sa mairie.';
