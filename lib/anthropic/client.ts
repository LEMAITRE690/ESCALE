import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Le modèle interprète une phrase libre du voyageur et la traduit en
// filtres structurés, exploitables directement par la requête Supabase —
// aucune recherche floue côté base de données, juste des filtres classiques
// une fois l'intention comprise.
export type FiltresRecherche = {
  ville: string | null;
  prixMax: number | null;
  prixMin: number | null;
  voyageurs: number | null;
  type: string | null; // appartement | maison | loft | chalet | cabane
  equipements: string[]; // parmi: wifi, parking, cuisine, clim, piscine
  animaux: boolean | null;
  resume: string; // reformulation courte de ce que le modèle a compris, affichée au voyageur
};

const OUTIL_EXTRACTION = {
  name: "filtres_recherche_logement",
  description: "Extrait des critères de recherche de logement structurés à partir d'une phrase en langage naturel.",
  input_schema: {
    type: "object" as const,
    properties: {
      ville: { type: ["string", "null"], description: "Ville ou région mentionnée, sinon null." },
      prixMax: { type: ["number", "null"], description: "Budget maximum par nuit en euros, sinon null." },
      prixMin: { type: ["number", "null"], description: "Budget minimum par nuit en euros, sinon null." },
      voyageurs: { type: ["number", "null"], description: "Nombre de voyageurs mentionné, sinon null." },
      type: {
        type: ["string", "null"],
        enum: ["appartement", "maison", "loft", "chalet", "cabane", null],
        description: "Type de logement déduit, sinon null.",
      },
      equipements: {
        type: "array",
        items: { type: "string", enum: ["wifi", "parking", "cuisine", "clim", "piscine"] },
        description: "Équipements demandés parmi cette liste fermée uniquement.",
      },
      animaux: { type: ["boolean", "null"], description: "true si des animaux sont mentionnés comme nécessaires, sinon null." },
      resume: { type: "string", description: "Reformulation courte (une phrase) de la recherche comprise, en français, à afficher au voyageur." },
    },
    required: ["ville", "prixMax", "prixMin", "voyageurs", "type", "equipements", "animaux", "resume"],
  },
};

export async function interpreterRecherche(phrase: string): Promise<FiltresRecherche> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001", // rapide et peu coûteux, suffisant pour de l'extraction structurée
    max_tokens: 500,
    tools: [OUTIL_EXTRACTION],
    tool_choice: { type: "tool", name: "filtres_recherche_logement" },
    messages: [
      {
        role: "user",
        content: `Voici une recherche de logement de vacances en langage naturel, à transformer en critères structurés : "${phrase}"`,
      },
    ],
  });

  const blocOutil = message.content.find((b) => b.type === "tool_use");
  if (!blocOutil || blocOutil.type !== "tool_use") {
    throw new Error("Impossible d'interpréter la recherche.");
  }

  return blocOutil.input as FiltresRecherche;
}
