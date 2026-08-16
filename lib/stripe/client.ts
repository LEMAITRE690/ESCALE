import Stripe from "stripe";
import {
  COMMISSION_RATE_TTC,
  CONCIERGERIE_RETROCOMMISSION,
  tauxPourFormule,
  type FormuleTarifaire,
} from "@/lib/pricing";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Formule "Commission" (sans abonnement) : 8,5 % TTC du montant du séjour.
// La formule "Abonnement" (19 €/mois TTC + 5 % TTC) n'est pas encore branchée
// dans le code de paiement — seule la formule Commission est calculée ici pour
// l'instant ; tous les hôtes y sont donc rattachés par défaut.
//
// Les taux ne sont plus définis ici : lib/pricing.json fait foi, pour
// l'application comme pour les documents contractuels. Ces deux réexports
// existent pour ne pas disperser les imports dans le code de paiement.
export const PLATFORM_FEE_RATE = COMMISSION_RATE_TTC;

// Rétrocommission versée à une conciergerie partenaire qui a apporté
// l'hôte, prélevée SUR la commission Escale (jamais en plus) : Escale
// passe de 8,5 % à 7,5 %, le partenaire perçoit le point restant. Le montant
// reversé à l'hôte est strictement identique, avec ou sans partenaire.
export const PARTNER_RETROCOMMISSION_RATE = CONCIERGERIE_RETROCOMMISSION;

export function computeFees(
  amountTotal: number,
  options?: {
    hasPartner?: boolean;
    touristTaxAmount?: number;
    /**
     * Formule de l'hôte au titre de cette réservation. L'appelant la lit à la
     * date de début du séjour (voir formule_hote_a en base) : le taux est figé
     * à la réservation et ne suit pas les changements ultérieurs de l'hôte.
     * Par défaut Commission, formule de base de tout hôte.
     */
    formule?: FormuleTarifaire;
  }
) {
  const hasPartner = !!options?.hasPartner;
  const { commission: tauxCommission, retrocommission: tauxRetrocommission } =
    tauxPourFormule(options?.formule ?? "commission");

  // La taxe de séjour est collectée pour le compte de la commune : elle
  // sort intégralement de l'assiette de la commission, dans les deux sens
  // (ni Escale ni le partenaire n'en prélèvent la moindre part). Elle est
  // en revanche toujours incluse dans amountHost, puisque c'est l'hôte —
  // jamais Escale — qui la reverse ensuite à sa mairie.
  const touristTaxAmount = options?.touristTaxAmount ?? 0;
  const assietteCommission = Math.max(0, amountTotal - touristTaxAmount);

  const totalCommission = Math.round(assietteCommission * tauxCommission);
  const partnerFee = hasPartner ? Math.round(assietteCommission * tauxRetrocommission) : 0;
  const platformFee = totalCommission - partnerFee;
  const amountHost = amountTotal - totalCommission;

  return { platformFee, partnerFee, amountHost, tauxCommission };
}
