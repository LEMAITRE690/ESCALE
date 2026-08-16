import { stripe } from "@/lib/stripe/client";
import { SUBSCRIPTION_FEE_TTC } from "@/lib/pricing";

// Abonnement hôte : 19 €/mois TTC, prélevés par carte ou par SEPA.
//
// Le prix Stripe est créé avec tax_behavior "inclusive" : les 19 € annoncés
// aux hôtes sont toutes taxes comprises, la TVA n'est pas ajoutée par-dessus.
// Voir scripts/creer-produit-abonnement.mjs pour la création initiale.

export const PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;

// SEPA d'abord : moins cher qu'une carte et plus familier aux hôtes français.
// La carte reste proposée, notamment pour les comptes non SEPA.
export const MOYENS_PAIEMENT_ABONNEMENT = ["sepa_debit", "card"] as const;

/**
 * Premier jour du mois suivant, à minuit UTC.
 *
 * Toute prise d'effet demandée par l'hôte est calée sur cette date : un
 * changement de formule n'est jamais rétroactif et ne s'applique jamais en
 * cours de mois.
 */
export function debutMoisProchain(depuis: Date = new Date()): Date {
  return new Date(Date.UTC(depuis.getUTCFullYear(), depuis.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

/**
 * Ouvre une session de paiement pour souscrire à l'abonnement.
 *
 * Le cycle de facturation est ancré au premier du mois suivant : l'hôte n'est
 * pas prélevé le jour de sa souscription, ce qui aligne le prélèvement sur la
 * date de prise d'effet de la formule. `proration_behavior: "none"` évite
 * toute facturation au prorata sur le mois en cours, pendant lequel l'hôte
 * relève encore de la formule Commission.
 */
export async function creerSessionAbonnement(params: {
  hostId: string;
  email: string;
  customerId: string | null;
  origine: string;
}) {
  if (!PRICE_ID) {
    throw new Error(
      "STRIPE_SUBSCRIPTION_PRICE_ID absent de l'environnement : lancez scripts/creer-produit-abonnement.mjs."
    );
  }

  const priseEffet = debutMoisProchain();

  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: [...MOYENS_PAIEMENT_ABONNEMENT],
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    ...(params.customerId
      ? { customer: params.customerId }
      : { customer_email: params.email }),
    subscription_data: {
      billing_cycle_anchor: Math.floor(priseEffet.getTime() / 1000),
      proration_behavior: "none",
      // Repris à l'identique sur chaque facture émise par Stripe : le webhook
      // retrouve l'hôte sans dépendre d'une correspondance par e-mail.
      metadata: { host_id: params.hostId },
    },
    metadata: { host_id: params.hostId },
    success_url: `${params.origine}/hote?abonnement=souscrit`,
    cancel_url: `${params.origine}/hote?abonnement=annule`,
  });
}
