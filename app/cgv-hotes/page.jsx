import React from "react";
import PageLegale, { Avertissement } from "@/components/PageLegale";
import TexteJuridique from "@/components/TexteJuridique";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { construireCGVHotes } from "@/lib/legal/cgv-hotes.mjs";
import { SOCIETE } from "@/lib/informations-legales";
import tarifs from "@/lib/pricing.json";

export const metadata = {
  title: "Conditions générales de vente — Hôtes — Escale",
  description:
    "Conditions financières et contractuelles applicables aux hôtes publiant une annonce sur Escale : formules tarifaires, paiement, facturation et rétractation.",
};

// Version publiée dans legal_documents, seule opposable et seule que les hôtes
// peuvent accepter. À défaut, le texte est composé à la volée pour rester
// consultable — en le signalant.
export const dynamic = "force-dynamic";

export default async function PageCGVHotes() {
  let publiee = null;
  try {
    const { data } = await supabaseAdmin
      .from("legal_documents_en_vigueur")
      .select("version, content, effective_from")
      .eq("type", "cgv_hotes")
      .maybeSingle();
    publiee = data ?? null;
  } catch {
    publiee = null;
  }

  const contenu =
    publiee?.content ?? construireCGVHotes({ tarifs, societe: SOCIETE, dateEffet: null });

  return (
    <PageLegale
      titre="Conditions générales de vente"
      chapeau="Conditions financières et contractuelles applicables aux hôtes qui publient une annonce sur Escale."
      miseAJour={
        publiee
          ? `version ${publiee.version}, en vigueur depuis le ${new Date(
              publiee.effective_from
            ).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
          : null
      }
    >
      <Avertissement>
        <strong>Document de travail.</strong> Ce texte doit être relu et validé par un
        avocat avant publication, et plusieurs mentions obligatoires restent à compléter
        dans <code className="font-mono text-xs">lib/informations-legales.js</code>.
        {!publiee && (
          <>
            {" "}
            Aucune version n'est encore publiée : ce texte est composé à la volée et n'est
            donc pas opposable. Publiez-en une avec{" "}
            <code className="font-mono text-xs">npm run publier:document cgv_hotes 1.0</code>.
          </>
        )}
      </Avertissement>

      <TexteJuridique contenu={contenu} />
    </PageLegale>
  );
}
