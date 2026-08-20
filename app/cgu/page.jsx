import React from "react";
import Link from "next/link";
import PageLegale, { Avertissement } from "@/components/PageLegale";
import TexteJuridique from "@/components/TexteJuridique";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { construireCGU } from "@/lib/legal/cgu.mjs";
import { SOCIETE, CONTACTS, MEDIATEUR, DERNIERE_MAJ } from "@/lib/informations-legales";
import tarifs from "@/lib/pricing.json";

export const metadata = {
  title: "Conditions générales — Escale",
  description: "Conditions générales d'utilisation et de service de la plateforme Escale : rôle d'intermédiaire, réservation, paiement séquestré, annulation, Charte du Prix Juste et litiges.",
};

export const dynamic = "force-dynamic";

async function versionPubliee() {
  try {
    const { data } = await supabaseAdmin.from("legal_documents_en_vigueur").select("version, content, effective_from").eq("type", "cgu").maybeSingle();
    return data ?? null;
  } catch { return null; }
}

export default async function PageCGU() {
  const publiee = await versionPubliee();
  const contenu = publiee?.content ?? construireCGU({ tarifs, societe: SOCIETE, contacts: CONTACTS, mediateur: MEDIATEUR });

  return (
    <PageLegale
      titre="Conditions générales"
      chapeau="Les présentes conditions régissent l'utilisation de la plateforme Escale, qui met en relation des hôtes proposant un hébergement et des voyageurs souhaitant le réserver."
      miseAJour={publiee ? `version ${publiee.version}, en vigueur depuis le ${new Date(publiee.effective_from).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : DERNIERE_MAJ}
    >
      <Avertissement>
        <strong>Document de travail.</strong> Ce texte décrit le fonctionnement réel de la plateforme mais n'a pas été validé par un juriste, et plusieurs mentions obligatoires restent à compléter dans <code className="font-mono text-xs">lib/informations-legales.js</code>. Il doit être relu par un professionnel du droit avant toute mise en ligne.
        {!publiee && <> Aucune version n'est encore publiée : ce texte est composé à la volée et n'est donc pas opposable. Publiez-en une avec <code className="font-mono text-xs">npm run publier:document cgu 1.0</code>.</>}
      </Avertissement>

      <TexteJuridique contenu={contenu} />

      <section className="mt-10 rounded-2xl border border-[#E4DCC8] bg-[#FFFDF8] p-6">
        <h2 className="font-serif text-2xl text-[#1B3A3A]">Annexe — Charte du Prix Juste Escale</h2>
        <p className="mt-3 text-sm leading-6 text-[#6B5B4D]">La Charte du Prix Juste fait partie du cadre contractuel applicable lorsqu’un hôte choisit volontairement d’y adhérer pour une annonce. L’activation du label vaut déclaration d’adhésion aux engagements décrits dans cette annexe.</p>
        <Link href="/charte-prix-juste" className="mt-4 inline-flex rounded-lg bg-[#1B3A3A] px-4 py-2.5 text-sm font-medium text-white">Lire la Charte du Prix Juste</Link>
      </section>
    </PageLegale>
  );
}
