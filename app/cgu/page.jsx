import React from "react";
import PageLegale, { Avertissement } from "@/components/PageLegale";
import TexteJuridique from "@/components/TexteJuridique";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { construireCGU } from "@/lib/legal/cgu.mjs";
import { SOCIETE, CONTACTS, MEDIATEUR, DERNIERE_MAJ } from "@/lib/informations-legales";
import tarifs from "@/lib/pricing.json";

export const metadata = {
  title: "Conditions générales — Escale",
  description:
    "Conditions générales d'utilisation et de service de la plateforme Escale : rôle d'intermédiaire, réservation, paiement séquestré, annulation et litiges.",
};

// Les CGU sont un document versionné : la page sert la version publiée dans
// legal_documents, seule opposable et seule que les utilisateurs peuvent
// accepter. Tant qu'aucune version n'est publiée — migration non appliquée,
// ou première publication à faire — la page compose le texte depuis
// lib/legal/cgu.mjs afin de ne jamais rester vide, en l'indiquant clairement.
export const dynamic = "force-dynamic";

async function versionPubliee() {
  try {
    const { data } = await supabaseAdmin
      .from("legal_documents_en_vigueur")
      .select("version, content, effective_from")
      .eq("type", "cgu")
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function PageCGU() {
  const publiee = await versionPubliee();

  const contenu =
    publiee?.content ??
    construireCGU({ tarifs, societe: SOCIETE, contacts: CONTACTS, mediateur: MEDIATEUR });

  return (
    <PageLegale
      titre="Conditions générales"
      chapeau="Les présentes conditions régissent l'utilisation de la plateforme Escale, qui met en relation des hôtes proposant un hébergement et des voyageurs souhaitant le réserver."
      miseAJour={
        publiee
          ? `version ${publiee.version}, en vigueur depuis le ${new Date(
              publiee.effective_from
            ).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
          : DERNIERE_MAJ
      }
    >
      <Avertissement>
        <strong>Document de travail.</strong> Ce texte décrit le fonctionnement réel de
        la plateforme mais n'a pas été validé par un juriste, et plusieurs mentions
        obligatoires restent à compléter dans{" "}
        <code className="font-mono text-xs">lib/informations-legales.js</code>. Il doit
        être relu par un professionnel du droit avant toute mise en ligne.
        {!publiee && (
          <>
            {" "}
            Aucune version n'est encore publiée : ce texte est composé à la volée et
            n'est donc pas opposable. Publiez-en une avec{" "}
            <code className="font-mono text-xs">npm run publier:document cgu 1.0</code>.
          </>
        )}
      </Avertissement>

      <TexteJuridique contenu={contenu} />
    </PageLegale>
  );
}
