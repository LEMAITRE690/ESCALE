import Stripe from "stripe";
import {
  COMMISSION_RATE_TTC,
  CONCIERGERIE_RETROCOMMISSION,
  tauxPourFormule,
  type FormuleTarifaire,
} from "@/lib/pricing";
import { computeFeeBreakdown } from "@/lib/finance/fees.mjs";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Formule "Commission" (sans abonnement) : 8 % TTC du montant du séjour
// hors taxe de séjour. La formule "Abonnement" applique 5 % TTC, en plus
// de l'abonnement mensuel. lib/pricing.json reste la source de vérité.
export const PLATFORM_FEE_RATE = COMMISSION_RATE_TTC;

// Rétrocommission conciergerie prélevée sur la commission Escale, jamais en
// supplément du montant dû par l'hôte.
export const PARTNER_RETROCOMMISSION_RATE = CONCIERGERIE_RETROCOMMISSION;

export function computeFees(
  amountTotal: number,
  options?: {
    hasPartner?: boolean;
    touristTaxAmount?: number;
    /** Formule applicable à la date de début du séjour. */
    formule?: FormuleTarifaire;
  }
) {
  const hasPartner = !!options?.hasPartner;
  const { commission: tauxCommission, retrocommission: tauxRetrocommission } =
    tauxPourFormule(options?.formule ?? "commission");

  const touristTaxAmount = options?.touristTaxAmount ?? 0;
  const repartition = computeFeeBreakdown({
    amountTotal,
    touristTaxAmount,
    commissionRate: tauxCommission,
    partnerRate: tauxRetrocommission,
    hasPartner,
  });

  return {
    platformFee: repartition.platformFee,
    partnerFee: repartition.partnerFee,
    amountHost: repartition.amountHost,
    touristTaxHeld: repartition.touristTaxHeld,
    commissionBase: repartition.commissionBase,
    totalCommission: repartition.totalCommission,
    tauxCommission,
  };
}
