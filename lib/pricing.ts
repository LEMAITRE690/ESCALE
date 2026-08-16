import tarifs from "./pricing.json";

// Source unique de vérité de la grille tarifaire Escale.
//
// Les valeurs numériques vivent dans pricing.json et non ici, pour qu'un seul
// fichier fasse foi côté application (import typé ci-dessous) comme côté
// scripts Node — notamment scripts/generer-cgu-pdf.mjs, qui produit
// docs/CGU_Escale.pdf et ne peut pas importer un module TypeScript.
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
 * base y étant déjà réduite. Escale conserve donc 4,5 % nets contre 7,5 % en
 * formule Commission.
 */
export const CONCIERGERIE_RETROCOMMISSION_ABONNEMENT =
  tarifs.CONCIERGERIE_RETROCOMMISSION_ABONNEMENT;

/** Les deux formules tarifaires proposées aux hôtes. */
export type FormuleTarifaire = "commission" | "abonnement";

/**
 * Taux applicables à une formule donnée. Regroupés ici pour que le code de
 * paiement n'ait jamais à choisir entre deux constantes selon la formule.
 */
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

/** Formate un taux en pourcentage à la française : 0.085 → « 8,5 % », 0.2 → « 20 % ». */
export function formatTaux(taux: number, decimales = 2): string {
  const brut = (taux * 100).toFixed(decimales);
  // Les zéros terminaux ne se retirent qu'après une virgule décimale : sans
  // cette garde, « 20 » deviendrait « 2 ».
  const nettoye = brut.includes(".")
    ? brut.replace(/0+$/, "").replace(/\.$/, "")
    : brut;
  return `${nettoye.replace(".", ",")} %`;
}

/** Formate un montant en euros à la française : 19 → « 19 € », 15.83 → « 15,83 € ». */
export function formatEuros(montant: number): string {
  return `${montant.toString().replace(".", ",")} €`;
}
