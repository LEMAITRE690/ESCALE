import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Formule "Commission" (sans abonnement) : 6% du montant du séjour.
// La formule "Abonnement" (25 €/mois + 2%) n'est pas encore branchée dans
// le code de paiement — seule la formule Commission est calculée ici pour
// l'instant ; tous les hôtes y sont donc rattachés par défaut.
export const PLATFORM_FEE_RATE = 0.06;

// Rétrocommission versée à une conciergerie partenaire qui a apporté
// l'hôte, prélevée SUR la commission Escale (jamais en plus) : Escale
// passe de 6% à 5%, le partenaire perçoit le point restant. Le montant
// reversé à l'hôte est strictement identique, avec ou sans partenaire.
export const PARTNER_RETROCOMMISSION_RATE = 0.01;

export function computeFees(
  amountTotal: number,
  options?: { hasPartner?: boolean; touristTaxAmount?: number }
) {
  const hasPartner = !!options?.hasPartner;
  // La taxe de séjour est collectée pour le compte de la commune : elle
  // sort intégralement de l'assiette de la commission, dans les deux sens
  // (Escale n'en prend pas 6%, le partenaire n'en prend pas 1%). Elle est
  // en revanche toujours incluse dans amountHost, puisque c'est l'hôte —
  // jamais Escale — qui la reverse ensuite à sa mairie.
  const touristTaxAmount = options?.touristTaxAmount ?? 0;
  const assietteCommission = Math.max(0, amountTotal - touristTaxAmount);

  const totalCommission = Math.round(assietteCommission * PLATFORM_FEE_RATE);
  const partnerFee = hasPartner ? Math.round(assietteCommission * PARTNER_RETROCOMMISSION_RATE) : 0;
  const platformFee = totalCommission - partnerFee;
  const amountHost = amountTotal - totalCommission;

  return { platformFee, partnerFee, amountHost };
}
