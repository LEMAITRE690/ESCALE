// Moteur financier pur, indépendant de Stripe/Lemonway et de Supabase.
// Tous les montants sont en centimes. La taxe de séjour est isolée du net
// hôte et de l'assiette de commission afin de pouvoir être conservée par le
// prestataire de paiement pour son reversement aux collectivités lorsque
// Escale est intermédiaire de paiement.

export function computeFeeBreakdown({
  amountTotal,
  touristTaxAmount = 0,
  commissionRate,
  partnerRate = 0,
  hasPartner = false,
}) {
  if (!Number.isInteger(amountTotal) || amountTotal < 0) {
    throw new TypeError("amountTotal doit être un entier positif en centimes");
  }
  if (!Number.isInteger(touristTaxAmount) || touristTaxAmount < 0 || touristTaxAmount > amountTotal) {
    throw new TypeError("touristTaxAmount doit être compris entre 0 et amountTotal");
  }
  if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 1) {
    throw new TypeError("commissionRate invalide");
  }
  if (typeof partnerRate !== "number" || partnerRate < 0 || partnerRate > commissionRate) {
    throw new TypeError("partnerRate invalide");
  }

  const commissionBase = amountTotal - touristTaxAmount;
  const totalCommission = Math.round(commissionBase * commissionRate);
  const partnerFee = hasPartner ? Math.round(commissionBase * partnerRate) : 0;
  const platformFee = totalCommission - partnerFee;
  const amountHost = commissionBase - totalCommission;
  const touristTaxHeld = touristTaxAmount;

  // Invariant comptable : aucun centime ne disparaît et aucun n'est créé.
  if (amountHost + platformFee + partnerFee + touristTaxHeld !== amountTotal) {
    throw new Error("Répartition financière incohérente");
  }

  return {
    commissionBase,
    totalCommission,
    platformFee,
    partnerFee,
    amountHost,
    touristTaxHeld,
  };
}
