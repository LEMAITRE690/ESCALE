// Détecte et masque les numéros de téléphone, e-mails et liens externes
// dans un message, pour limiter les réservations organisées en direct hors
// d'Escale (perte de la protection du paiement séquestré et de la
// médiation pour les deux parties, perte de commission pour la plateforme).
//
// Limite assumée : un filtrage par expression régulière n'attrape pas une
// évasion volontaire et travaillée (numéro épelé en toutes lettres, "arobase"
// écrit au lieu de "@", capture d'écran...). C'est un frein, pas une
// garantie absolue — à documenter honnêtement, jamais présenté comme
// infaillible.

export type ResultatFiltrage = {
  contenuFiltre: string;
  contientCoordonnees: boolean;
  typesDetectes: string[];
};

export function filtrerCoordonnees(message: string): ResultatFiltrage {
  // Les regex sont recréées à chaque appel : une regex globale (/g) partagée
  // entre appels garde un état interne (lastIndex) qui fausserait la
  // détection dès le second message si elle était définie au niveau du module.
  const regexTelephone = /(\+33|0033|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}/g;
  const regexEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const regexLienExterne = /(https?:\/\/|www\.)[^\s]+|wa\.me\/\S+|t\.me\/\S+/gi;

  const typesDetectes: string[] = [];
  if (regexTelephone.test(message)) typesDetectes.push("telephone");
  if (regexEmail.test(message)) typesDetectes.push("email");
  if (regexLienExterne.test(message)) typesDetectes.push("lien_externe");

  const contenuFiltre = message
    .replace(/(\+33|0033|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}/g, "[coordonnées masquées]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[coordonnées masquées]")
    .replace(/(https?:\/\/|www\.)[^\s]+|wa\.me\/\S+|t\.me\/\S+/gi, "[lien masqué]");

  return {
    contenuFiltre,
    contientCoordonnees: typesDetectes.length > 0,
    typesDetectes,
  };
}
