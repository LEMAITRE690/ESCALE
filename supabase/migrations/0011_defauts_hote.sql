-- Préférences par défaut de l'hôte, pré-remplies à chaque nouvelle annonce
-- (l'hôte reste libre de les modifier annonce par annonce ; ce n'est qu'un
-- point de départ, jamais une valeur imposée).

alter table public.profiles
  add column if not exists default_listing_options jsonb not null default '{
    "equipements": [],
    "animauxAcceptes": false, "fraisAnimaux": null,
    "menagePayant": false, "fraisMenage": null,
    "departTardif": false, "heureDepartTardif": "12:00", "fraisDepartTardif": null,
    "sejourMin": null, "sejourMax": null,
    "reservationInstantanee": true,
    "arriveeAnticipee": false, "heureArriveeAnticipee": "13:00", "fraisArriveeAnticipee": null,
    "enfantsBienvenus": false, "equipementLitParapluie": false, "equipementChaiseHaute": false,
    "fumeursAcceptes": false, "evenementsAutorises": false,
    "politiqueAnnulation": "moderee", "caution": null
  }'::jsonb;
