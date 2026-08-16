// Publie une version d'un document juridique dans legal_documents.
//
// Le texte est composé à partir des taux et des mentions légales du moment,
// puis figé : la version publiée ne dépend plus du code. Pour corriger un
// texte, on publie une nouvelle version — la contrainte d'unicité sur
// (type, version) refuse d'écraser une version existante, et un trigger
// interdit de modifier une version déjà acceptée.
//
// Usage :
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/publier-document.mjs cgv_hotes 1.0 [--forcer]

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { construireCGU } from "../lib/legal/cgu.mjs";
import { construireCGVHotes } from "../lib/legal/cgv-hotes.mjs";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");

const [type, version] = process.argv.slice(2);
const forcer = process.argv.includes("--forcer");

const DOCUMENTS = {
  cgu: {
    titre: "Conditions générales d'utilisation",
    construire: ({ tarifs, SOCIETE, CONTACTS, MEDIATEUR }) =>
      construireCGU({ tarifs, societe: SOCIETE, contacts: CONTACTS, mediateur: MEDIATEUR }),
  },
  cgv_hotes: {
    titre: "Conditions générales de vente — Hôtes",
    construire: ({ tarifs, SOCIETE, dateEffet }) =>
      construireCGVHotes({ tarifs, societe: SOCIETE, dateEffet }),
  },
};

if (!DOCUMENTS[type] || !version) {
  console.error(
    `Usage : node scripts/publier-document.mjs <${Object.keys(DOCUMENTS).join("|")}> <version>`
  );
  process.exit(1);
}

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SUPABASE || !CLE) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.");
  process.exit(1);
}

const tarifs = JSON.parse(readFileSync(join(RACINE, "lib", "pricing.json"), "utf8"));
const mentions = await import(join(RACINE, "lib", "informations-legales.js"));
const dateEffet = new Date().toISOString();

const contenu = DOCUMENTS[type].construire({ tarifs, dateEffet, ...mentions });

if (contenu.includes("À COMPLÉTER")) {
  console.warn(
    "\n⚠  Le texte contient encore des mentions « À COMPLÉTER » issues de\n" +
      "   lib/informations-legales.js. Une version publiée étant figée, elle\n" +
      "   conserverait ces trous en l'état.\n"
  );
  if (!forcer) {
    console.error("Publication interrompue. Relancez avec --forcer pour passer outre.");
    process.exit(1);
  }
}

const empreinte = createHash("sha256").update(contenu, "utf8").digest("hex");

const reponse = await fetch(`${URL_SUPABASE}/rest/v1/legal_documents`, {
  method: "POST",
  headers: {
    apikey: CLE,
    Authorization: `Bearer ${CLE}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({
    type,
    version,
    title: DOCUMENTS[type].titre,
    content: contenu,
    content_hash: empreinte,
    effective_from: dateEffet,
  }),
});

if (!reponse.ok) {
  console.error(`Publication refusée (${reponse.status}) :`, await reponse.text());
  process.exit(1);
}

const [document] = await reponse.json();
console.log(`${DOCUMENTS[type].titre} — version ${document.version} publiée.`);
console.log(`  id        : ${document.id}`);
console.log(`  empreinte : ${empreinte.slice(0, 16)}…`);
console.log(`  ${contenu.length} caractères figés.`);
