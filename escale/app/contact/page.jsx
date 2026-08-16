import React from "react";
import Link from "next/link";
import { Mail, LifeBuoy, Scale, ShieldCheck, MapPin, Phone } from "lucide-react";
import PageLegale, { Article, Avertissement } from "@/components/PageLegale";
import { SOCIETE, CONTACTS, MEDIATEUR, DERNIERE_MAJ } from "@/lib/informations-legales";

export const metadata = {
  title: "Contact — Escale",
  description:
    "Contacter l'équipe Escale : support voyageurs et hôtes, signalement d'un litige, questions sur vos données personnelles.",
};

// Volontairement pas de formulaire : il n'existe aucune route d'API pour le
// recevoir. Un formulaire non branché serait un bouton mort de plus.
const CANAUX = [
  {
    icon: LifeBuoy,
    titre: "Support voyageurs et hôtes",
    texte:
      "Une question sur une réservation, un paiement, une annonce ou votre compte. Réponse sous 48 heures ouvrées.",
    email: CONTACTS.support,
  },
  {
    icon: Scale,
    titre: "Signaler un litige",
    texte:
      "Un problème pendant ou après un séjour. Signalez-le avant le reversement des fonds à l'hôte pour que le versement soit suspendu le temps de l'instruction.",
    email: CONTACTS.litiges,
  },
  {
    icon: ShieldCheck,
    titre: "Données personnelles",
    texte:
      "Accès, rectification ou suppression de vos données, et toute question sur leur traitement.",
    email: CONTACTS.donnees,
  },
  {
    icon: Mail,
    titre: "Autres demandes",
    texte: "Partenariats, presse, ou tout sujet qui n'entre dans aucune des catégories ci-dessus.",
    email: CONTACTS.general,
  },
];

export default function PageContact() {
  return (
    <PageLegale
      titre="Nous contacter"
      chapeau="Écrivez-nous à l'adresse qui correspond à votre demande : cela nous permet de vous répondre plus vite."
      miseAJour={DERNIERE_MAJ}
    >
      <Avertissement>
        <strong>Adresses à confirmer.</strong> Les adresses e-mail et les coordonnées
        postales ci-dessous sont des espaces réservés définis dans{" "}
        <code className="font-mono text-xs">lib/informations-legales.js</code>. Elles
        doivent être remplacées par des boîtes réellement relevées avant mise en ligne.
      </Avertissement>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {CANAUX.map(({ icon: Icon, titre, texte, email }) => (
          <div
            key={titre}
            className="border border-[#E4DCC8] rounded-xl bg-[#FFFDF8] p-5 flex flex-col"
          >
            <Icon size={18} className="text-[#C97B3D] mb-3" />
            <h2 className="font-serif text-lg mb-1.5">{titre}</h2>
            <p className="text-sm text-[#6B5B4D] leading-relaxed mb-4 grow">{texte}</p>
            <a
              href={`mailto:${email}`}
              className="text-sm font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors break-all"
            >
              {email}
            </a>
          </div>
        ))}
      </div>

      <Article titre="Avant de nous écrire">
        <p>
          Pour toute question portant sur un séjour précis — horaires d'arrivée, équipements,
          règles du logement — le plus rapide reste d'échanger directement avec votre hôte
          ou votre voyageur depuis la messagerie de la réservation : cette conversation est
          conservée avec le dossier et nous permet, si besoin, de reprendre le fil sans que
          vous ayez à tout réexpliquer.
        </p>
        <p>
          Beaucoup de questions fréquentes (commission, moment du versement à l'hôte,
          synchronisation Airbnb, assurance) trouvent leur réponse{" "}
          <Link href="/#faq" className="text-[#2F6E6E] underline hover:text-[#1B3A3A]">
            dans la FAQ de la page d'accueil
          </Link>
          .
        </p>
      </Article>

      <Article titre="Coordonnées postales">
        <p className="flex items-start gap-2">
          <MapPin size={15} className="mt-0.5 shrink-0 text-[#8C7A66]" />
          <span>
            {SOCIETE.denomination}
            <br />
            {SOCIETE.siege}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Phone size={15} className="shrink-0 text-[#8C7A66]" />
          {CONTACTS.telephone}
        </p>
      </Article>

      <Article titre="Médiation de la consommation">
        <p>
          Si notre réponse ne vous satisfait pas, vous pouvez saisir gratuitement le
          médiateur de la consommation : {MEDIATEUR.nom} — {MEDIATEUR.site}. Cette
          démarche suppose d'avoir d'abord tenté de résoudre le différend directement avec
          nous par écrit.
        </p>
        <p>
          Le détail de la procédure figure à l'article 16 de nos{" "}
          <Link href="/cgu" className="text-[#2F6E6E] underline hover:text-[#1B3A3A]">
            conditions générales
          </Link>
          .
        </p>
      </Article>
    </PageLegale>
  );
}
