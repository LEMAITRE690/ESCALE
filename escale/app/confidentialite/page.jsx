import React from "react";
import Link from "next/link";
import PageLegale, { Article, Avertissement } from "@/components/PageLegale";
import {
  SOCIETE,
  CONTACTS,
  SOUS_TRAITANTS,
  DERNIERE_MAJ,
} from "@/lib/informations-legales";

export const metadata = {
  title: "Politique de confidentialité — Escale",
  description:
    "Quelles données personnelles Escale collecte, pourquoi, avec qui elles sont partagées, combien de temps elles sont conservées et comment exercer vos droits.",
};

// Finalités de traitement — chaque ligne correspond à un usage réellement
// présent dans l'application (compte, annonce, réservation, paiement,
// messagerie, documents, avis, recherche assistée).
const TRAITEMENTS = [
  {
    finalite: "Créer et gérer votre compte",
    donnees: "Nom, adresse e-mail, mot de passe (haché), téléphone, photo de profil, bio, rôle",
    base: "Exécution du contrat",
    duree: "Durée du compte, puis 3 ans après le dernier contact",
  },
  {
    finalite: "Publier et afficher les annonces",
    donnees: "Description, adresse et ville du logement, photos, tarifs, équipements, calendrier",
    base: "Exécution du contrat",
    duree: "Durée de publication, puis 3 ans",
  },
  {
    finalite: "Traiter les réservations",
    donnees: "Dates de séjour, nombre de voyageurs, montant, statut, identité des parties",
    base: "Exécution du contrat",
    duree: "10 ans (obligation comptable)",
  },
  {
    finalite: "Encaisser les paiements, les cautions et verser les hôtes",
    donnees: "Montant, devise, identifiants de transaction, coordonnées de versement",
    base: "Exécution du contrat et obligation légale",
    duree: "10 ans (obligation comptable)",
  },
  {
    finalite: "Permettre la messagerie entre hôte et voyageur",
    donnees: "Contenu des messages, horodatage, pièces jointes",
    base: "Exécution du contrat",
    duree: "3 ans après le séjour",
  },
  {
    finalite: "Vérifier l'identité et collecter les justificatifs",
    donnees: "Pièces d'identité et documents transmis par les voyageurs et les hôtes",
    base: "Obligation légale et intérêt légitime (lutte contre la fraude)",
    duree: "Durée nécessaire à la vérification, puis suppression",
  },
  {
    finalite: "Publier les avis et traiter les signalements",
    donnees: "Note, commentaire, réponse de l'hôte, description du problème signalé",
    base: "Exécution du contrat et intérêt légitime",
    duree: "3 ans après publication",
  },
  {
    finalite: "Améliorer la recherche en langage naturel",
    donnees: "Termes de recherche saisis",
    base: "Intérêt légitime (pertinence du service)",
    duree: "13 mois",
  },
];

export default function PageConfidentialite() {
  return (
    <PageLegale
      titre="Politique de confidentialité"
      chapeau="Escale traite des données personnelles pour permettre la mise en relation, la réservation et le paiement sécurisé. Cette page explique lesquelles, pourquoi, et quels sont vos droits."
      miseAJour={DERNIERE_MAJ}
    >
      <Avertissement>
        <strong>Document de travail.</strong> Les traitements décrits reflètent le
        fonctionnement actuel de l'application, mais l'identité du responsable de
        traitement et les coordonnées restent à compléter dans{" "}
        <code className="font-mono text-xs">lib/informations-legales.js</code>. Une
        relecture juridique est nécessaire avant publication, ainsi qu'une vérification
        de la localisation réelle des serveurs de chaque prestataire.
      </Avertissement>

      <Article numero="1" titre="Responsable du traitement">
        <p>
          Le responsable du traitement est {SOCIETE.denomination}, dont le siège social est
          situé {SOCIETE.siege}. Pour toute question relative à vos données, écrivez à{" "}
          <a
            href={`mailto:${CONTACTS.donnees}`}
            className="text-[#2F6E6E] underline hover:text-[#1B3A3A]"
          >
            {CONTACTS.donnees}
          </a>
          .
        </p>
      </Article>

      <Article numero="2" titre="Données traitées et finalités">
        <p>
          Escale ne collecte que les données nécessaires au fonctionnement du service.
          Aucune donnée n'est vendue à des tiers, et aucune n'est utilisée à des fins
          publicitaires.
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs border-collapse mt-2">
            <thead>
              <tr className="text-left text-[#1B3A3A]">
                <th className="border-b border-[#D8CCB0] py-2 pr-3 font-medium">Finalité</th>
                <th className="border-b border-[#D8CCB0] py-2 pr-3 font-medium">Données</th>
                <th className="border-b border-[#D8CCB0] py-2 pr-3 font-medium">Base légale</th>
                <th className="border-b border-[#D8CCB0] py-2 font-medium">Conservation</th>
              </tr>
            </thead>
            <tbody>
              {TRAITEMENTS.map((t) => (
                <tr key={t.finalite} className="align-top">
                  <td className="border-b border-[#E4DCC8] py-2.5 pr-3 text-[#1B3A3A]">
                    {t.finalite}
                  </td>
                  <td className="border-b border-[#E4DCC8] py-2.5 pr-3">{t.donnees}</td>
                  <td className="border-b border-[#E4DCC8] py-2.5 pr-3">{t.base}</td>
                  <td className="border-b border-[#E4DCC8] py-2.5">{t.duree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Article>

      <Article numero="3" titre="Ce que voient les autres utilisateurs">
        <p>
          Votre nom, votre photo de profil et votre bio sont visibles des utilisateurs avec
          qui vous êtes en relation. Après une réservation, l'hôte et le voyageur ont accès
          aux informations nécessaires au séjour. Les avis que vous publiez sont visibles
          publiquement sur l'annonce concernée, sous votre prénom et l'initiale de votre
          nom.
        </p>
        <p>
          Votre adresse e-mail et votre téléphone ne sont pas affichés sur la plateforme.
          La messagerie filtre par défaut les coordonnées échangées avant la confirmation
          d'une réservation.
        </p>
      </Article>

      <Article numero="4" titre="Prestataires ayant accès aux données">
        <p>
          Escale fait appel aux prestataires suivants, agissant comme sous-traitants au
          sens de l'article 28 du RGPD :
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          {SOUS_TRAITANTS.map((s) => (
            <li key={s.nom}>
              <strong>{s.nom}</strong> — {s.role}. Localisation : {s.localisation}.
            </li>
          ))}
        </ul>
        <p>
          Des données peuvent en outre être transmises à l'administration fiscale ou aux
          autorités judiciaires lorsque la loi l'impose.
        </p>
      </Article>

      <Article numero="5" titre="Transferts hors Union européenne">
        <p>
          Certains prestataires peuvent traiter des données en dehors de l'Union
          européenne. Ces transferts sont encadrés par les clauses contractuelles types de
          la Commission européenne ou par une décision d'adéquation.
        </p>
      </Article>

      <Article numero="6" titre="Cookies et traceurs">
        <p>
          Escale utilise des cookies strictement nécessaires au fonctionnement du service :
          maintien de votre session, sécurisation de l'authentification et mémorisation de
          vos préférences d'affichage. Ces cookies sont dispensés de consentement.
        </p>
        <p>
          Aucun cookie publicitaire ni traceur de mesure d'audience tiers n'est déposé. Si
          cela devait changer, un bandeau de consentement serait mis en place et cette
          page mise à jour.
        </p>
      </Article>

      <Article numero="7" titre="Sécurité">
        <p>
          Les mots de passe sont stockés sous forme hachée et ne sont jamais accessibles en
          clair. Les échanges avec la plateforme sont chiffrés en transit. L'accès aux
          données est restreint aux personnes qui en ont besoin, et les données bancaires
          ne transitent jamais par nos serveurs : elles sont traitées directement par notre
          prestataire de paiement.
        </p>
      </Article>

      <Article numero="8" titre="Vos droits">
        <p>
          Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation,
          d'opposition et de portabilité, ainsi que du droit de définir des directives sur
          le sort de vos données après votre décès.
        </p>
        <p>
          Pour les exercer, écrivez à{" "}
          <a
            href={`mailto:${CONTACTS.donnees}`}
            className="text-[#2F6E6E] underline hover:text-[#1B3A3A]"
          >
            {CONTACTS.donnees}
          </a>
          . Une réponse vous sera apportée dans un délai d'un mois. Certaines données ne
          peuvent pas être supprimées à votre demande lorsqu'une obligation légale impose
          leur conservation, notamment les pièces comptables liées aux réservations.
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la CNIL —{" "}
          <a
            href="https://www.cnil.fr"
            className="text-[#2F6E6E] underline hover:text-[#1B3A3A]"
            target="_blank"
            rel="noopener noreferrer"
          >
            cnil.fr
          </a>
          .
        </p>
      </Article>

      <Article numero="9" titre="Modification de cette politique">
        <p>
          Cette politique peut évoluer avec le service. En cas de changement substantiel,
          vous en serez informé avant son entrée en vigueur. Les{" "}
          <Link href="/cgu" className="text-[#2F6E6E] underline hover:text-[#1B3A3A]">
            conditions générales
          </Link>{" "}
          complètent le présent document.
        </p>
      </Article>
    </PageLegale>
  );
}
