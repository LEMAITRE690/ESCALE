import tarifs from "./pricing.json";

// Source unique de vérité de la grille tarifaire Escale.
//
// Les valeurs numériques vivent dans pricing.json et non ici, pour qu'un seul
// fichier fasse foi côté application (import typé ci-dessous) comme côté
// scripts Node — notamment scripts/generer-cgu-pdf.mjs.
//
// Escale est assujettie à la TVA. Les taux affichés aux hôtes sont exprimés
// TTC ; les équivalents HT ne servent qu'à la ventilation comptable.

/** Formule Commission : prélèvement TTC sur chaque réservation confirmée. */
export const COMMISSION_RATE_TTC = tarifs.COMMISSION_RATE_TTC;

/** Équivalent hors taxes de la formule Commission. */
export const COMMISSION_RATE_HT = tarifs.COMMISSION_RATE_HT;

/** Formule Abonnement : part fixe mensuelle TTC, en euros. */
export const SUBSCRIPTION_FEE_TTC = tarifs.SUBSCRIPTION_FEE_TTC;

/** Équivalent hors taxes de la part fixe mensuelle, en euros. */
export const SUBSCRIPTION_FEE_HT = tarifs.SUBSCRIPTION_FEE_HT;

/** Formule Abonnement : prélèvement TTC par réservation, en complément du fixe. */
export const SUBSCRIPTION_RATE_TTC = tarifs.SUBSCRIPTION_RATE_TTC;

/** Équivalent hors taxes du prélèvement par réservation de la formule Abonnement. */
export const SUBSCRIPTION_RATE_HT = tarifs.SUBSCRIPTION_RATE_HT;

/**
 * Rétrocommission versée à une conciergerie partenaire, exprimée en points de
 * commission. Elle est prélevée SUR la commission Escale, jamais en plus : le
 * montant reversé à l'hôte est identique avec ou sans partenaire.
 */
export const CONCIERGERIE_RETROCOMMISSION = tarifs.CONCIERGERIE_RETROCOMMISSION;

/**
 * Rétrocommission en formule Abonnement : un demi-point, la commission de
 * base y étant déjà réduite. Escale conserve donc 4,5 % TTC avant ses autres
 * coûts lorsqu'une conciergerie est impliquée, contre 7 % TTC en formule
 * Commission avec une rétrocommission d'un point.
 */
export const CONCIERGERIE_RETROCOMMISSION_ABONNEMENT =
  tarifs.CONCIERGERIE_RETROCOMMISSION_ABONNEMENT;

/** Les deux formules tarifaires proposées aux hôtes. */
export type FormuleTarifaire = "commission" | "abonnement";

/** Taux applicables à une formule donnée. */
export function tauxPourFormule(formule: FormuleTarifaire) {
  return formule === "abonnement"
    ? {
        commission: tarifs.SUBSCRIPTION_RATE_TTC,
        retrocommission: tarifs.CONCIERGERIE_RETROCOMMISSION_ABONNEMENT,
      }
    : {
        commission: tarifs.COMMISSION_RATE_TTC,
        retrocommission: tarifs.CONCIERGERIE_RETROCOMMISSION,
      };
}

/** Taux de TVA applicable à la commission Escale. */
export const VAT_RATE = tarifs.VAT_RATE;

/** Part nette conservée par Escale lorsqu'une conciergerie a apporté l'hôte. */
export const COMMISSION_RATE_TTC_NET_PARTENAIRE =
  Math.round((COMMISSION_RATE_TTC - CONCIERGERIE_RETROCOMMISSION) * 10000) / 10000;

/** Formate un taux en pourcentage à la française : 0.08 → « 8 % », 0.2 → « 20 % ». */
export function formatTaux(taux: number, decimales = 2): string {
  const brut = (taux * 100).toFixed(decimales);
  const nettoye = brut.includes(".")
    ? brut.replace(/0+$/, "").replace(/\.$/, "")
    : brut;
  return `${nettoye.replace(".", ",")} %`;
}

/** Formate un montant en euros à la française : 19 → « 19 € », 15.83 → « 15,83 € ». */
export function formatEuros(montant: number): string {
  return `${montant.toString().replace(".", ",")} €`;
}
