// Crée le produit et le prix récurrent de la formule Abonnement dans Stripe.
//
// Idempotent : le produit est repéré par ses métadonnées, et un prix existant
// au bon montant est réutilisé. Relancer le script ne crée pas de doublon.
//
// Les prix Stripe étant immuables, un changement de tarif crée un NOUVEAU prix
// et désactive l'ancien ; les abonnements en cours restent sur l'ancien prix
// jusqu'à leur migration explicite.
//
// Usage :
//   STRIPE_SECRET_KEY=sk_test_... node scripts/creer-produit-abonnement.mjs
//
// À lancer une fois en test, une fois en production. Reportez ensuite le
// STRIPE_SUBSCRIPTION_PRICE_ID affiché dans les variables d'environnement
// Vercel de l'environnement correspondant.

import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const tarifs = JSON.parse(readFileSync(join(RACINE, "lib", "pricing.json"), "utf8"));

const CLE = process.env.STRIPE_SECRET_KEY;
if (!CLE) {
  console.error("STRIPE_SECRET_KEY manquante.");
  process.exit(1);
}

const stripe = new Stripe(CLE, { apiVersion: "2024-06-20" });
const MARQUEUR = "escale_abonnement_hote";
const MONTANT_CENTIMES = Math.round(tarifs.SUBSCRIPTION_FEE_TTC * 100);

const mode = CLE.startsWith("sk_live_") ? "PRODUCTION" : "test";
console.log(`Mode ${mode} — abonnement à ${(MONTANT_CENTIMES / 100).toFixed(2)} € TTC par mois.\n`);

// 1. Produit
const produits = await stripe.products.search({
  query: `metadata['escale_role']:'${MARQUEUR}'`,
});

let produit = produits.data[0];
if (produit) {
  console.log(`Produit existant réutilisé : ${produit.id}`);
} else {
  produit = await stripe.products.create({
    name: "Escale — Formule Abonnement hôte",
    description:
      "Abonnement mensuel réduisant la commission prélevée sur chaque réservation.",
    metadata: { escale_role: MARQUEUR },
  });
  console.log(`Produit créé : ${produit.id}`);
}

// 2. Prix récurrent. tax_behavior "inclusive" : le montant annoncé est TTC.
const prixExistants = await stripe.prices.list({
  product: produit.id,
  active: true,
  limit: 100,
});

let prix = prixExistants.data.find(
  (p) =>
    p.unit_amount === MONTANT_CENTIMES &&
    p.currency === "eur" &&
    p.recurring?.interval === "month" &&
    p.tax_behavior === "inclusive"
);

if (prix) {
  console.log(`Prix existant réutilisé : ${prix.id}`);
} else {
  prix = await stripe.prices.create({
    product: produit.id,
    currency: "eur",
    unit_amount: MONTANT_CENTIMES,
    recurring: { interval: "month" },
    tax_behavior: "inclusive",
    metadata: { escale_role: MARQUEUR },
  });
  console.log(`Prix créé : ${prix.id}`);

  // Les anciens prix actifs du même produit sont désactivés : sans cela, un
  // ancien tarif resterait sélectionnable.
  for (const ancien of prixExistants.data) {
    if (ancien.id !== prix.id) {
      await stripe.prices.update(ancien.id, { active: false });
      console.log(`Ancien prix désactivé : ${ancien.id}`);
    }
  }
}

console.log(`\nÀ reporter dans l'environnement ${mode} :`);
console.log(`STRIPE_SUBSCRIPTION_PRICE_ID=${prix.id}`);
