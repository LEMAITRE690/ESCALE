// Informations légales et de contact affichées sur /cgu, /confidentialite
// et /contact.
//
// ⚠️ À COMPLÉTER AVANT MISE EN LIGNE — ces valeurs sont des espaces réservés.
// Les champs marqués « À COMPLÉTER » sont des mentions obligatoires (art. 6
// III de la LCEN pour l'éditeur, art. L.221-5 du Code de la consommation pour
// les coordonnées, art. 13 du RGPD pour le responsable de traitement).
// Elles n'ont volontairement pas été inventées.

export const SOCIETE = {
  denomination: "À COMPLÉTER — dénomination sociale",
  formeJuridique: "À COMPLÉTER — forme juridique (SAS, SARL…)",
  capital: "À COMPLÉTER — capital social",
  siege: "À COMPLÉTER — adresse du siège social",
  rcs: "À COMPLÉTER — ville et numéro RCS",
  siret: "À COMPLÉTER — SIRET",
  tva: "À COMPLÉTER — numéro de TVA intracommunautaire",
  directeurPublication: "À COMPLÉTER — nom du directeur de la publication",
  hebergeur: "À COMPLÉTER — nom et adresse de l'hébergeur",
};

export const CONTACTS = {
  general: "contact@escale.fr",
  support: "support@escale.fr",
  litiges: "litiges@escale.fr",
  donnees: "donnees@escale.fr",
  telephone: "À COMPLÉTER — numéro de téléphone",
};

// Médiateur de la consommation : l'adhésion à un dispositif de médiation est
// obligatoire pour un professionnel vendant à des consommateurs
// (art. L.612-1 du Code de la consommation).
export const MEDIATEUR = {
  nom: "À COMPLÉTER — nom du médiateur de la consommation",
  site: "À COMPLÉTER — site du médiateur",
};

// Prestataires ayant accès à des données personnelles (sous-traitants au sens
// de l'art. 28 du RGPD). Déduits des dépendances réellement utilisées par
// l'application — à mettre à jour si la pile technique change.
export const SOUS_TRAITANTS = [
  {
    nom: "Supabase",
    role: "Hébergement de la base de données, authentification et stockage des fichiers",
    localisation: "Union européenne (région à confirmer selon le projet)",
  },
  {
    nom: "Stripe",
    role: "Traitement des paiements, séquestre des fonds, versements aux hôtes et cautions",
    localisation: "Irlande / États-Unis (clauses contractuelles types)",
  },
  {
    nom: "Anthropic",
    role: "Analyse des recherches en langage naturel (recherche assistée)",
    localisation: "États-Unis (clauses contractuelles types)",
  },
];

export const DERNIERE_MAJ = "16 août 2026";
