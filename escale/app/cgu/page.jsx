import React from "react";
import Link from "next/link";
import PageLegale, { Article, Avertissement } from "@/components/PageLegale";
import { SOCIETE, CONTACTS, MEDIATEUR, DERNIERE_MAJ } from "@/lib/informations-legales";

export const metadata = {
  title: "Conditions générales — Escale",
  description:
    "Conditions générales d'utilisation et de service de la plateforme Escale : rôle d'intermédiaire, réservation, paiement séquestré, annulation et litiges.",
};

export default function PageCGU() {
  return (
    <PageLegale
      titre="Conditions générales"
      chapeau="Les présentes conditions régissent l'utilisation de la plateforme Escale, qui met en relation des hôtes proposant un hébergement et des voyageurs souhaitant le réserver."
      miseAJour={DERNIERE_MAJ}
    >
      <Avertissement>
        <strong>Document de travail.</strong> Ce texte décrit le fonctionnement réel de
        la plateforme mais n'a pas été validé par un juriste, et plusieurs mentions
        obligatoires restent à compléter dans{" "}
        <code className="font-mono text-xs">lib/informations-legales.js</code>. Il doit
        être relu par un professionnel du droit avant toute mise en ligne.
      </Avertissement>

      <Article numero="1" titre="Éditeur de la plateforme">
        <p>
          La plateforme Escale, accessible en ligne et sous forme d'application
          installable, est éditée par {SOCIETE.denomination} ({SOCIETE.formeJuridique}),
          au capital de {SOCIETE.capital}, dont le siège social est situé{" "}
          {SOCIETE.siege}, immatriculée au {SOCIETE.rcs} sous le numéro SIRET{" "}
          {SOCIETE.siret}, numéro de TVA intracommunautaire {SOCIETE.tva}.
        </p>
        <p>
          Directeur de la publication : {SOCIETE.directeurPublication}. Hébergement :{" "}
          {SOCIETE.hebergeur}. Contact : {CONTACTS.general}.
        </p>
      </Article>

      <Article numero="2" titre="Définitions">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Plateforme</strong> : le service en ligne Escale, ses interfaces web
            et mobile, et les services associés.
          </li>
          <li>
            <strong>Hôte</strong> : utilisateur qui publie une annonce et propose un
            hébergement à la location.
          </li>
          <li>
            <strong>Voyageur</strong> : utilisateur qui réserve un hébergement publié sur
            la plateforme.
          </li>
          <li>
            <strong>Annonce</strong> : la description, les photos, le tarif, les
            équipements et les règles d'un hébergement, définis par l'hôte.
          </li>
          <li>
            <strong>Réservation</strong> : le contrat de location conclu directement entre
            un hôte et un voyageur par l'intermédiaire de la plateforme.
          </li>
          <li>
            <strong>Commission</strong> : la rémunération d'Escale au titre de son service
            de mise en relation.
          </li>
        </ul>
      </Article>

      <Article numero="3" titre="Rôle d'Escale : un intermédiaire, pas un loueur">
        <p>
          Escale fournit un service de mise en relation et d'encaissement sécurisé. Escale
          n'est ni propriétaire, ni gestionnaire, ni locataire des hébergements publiés, et
          n'est pas partie au contrat de location conclu entre l'hôte et le voyageur.
        </p>
        <p>
          Le contrat de location est formé exclusivement entre l'hôte et le voyageur. Les
          conditions particulières de chaque séjour — horaires d'arrivée et de départ,
          acceptation des animaux, ménage, politique d'annulation, montant de la caution —
          sont définies par l'hôte dans son annonce et prévalent sur toute description
          générale de la plateforme.
        </p>
      </Article>

      <Article numero="4" titre="Inscription et compte utilisateur">
        <p>
          L'inscription est réservée aux personnes physiques majeures et capables, et aux
          personnes morales dûment représentées. L'utilisateur garantit l'exactitude des
          informations communiquées et s'engage à les tenir à jour.
        </p>
        <p>
          L'utilisateur est responsable de la confidentialité de ses identifiants et de
          toute activité réalisée depuis son compte. Certaines fonctionnalités
          (publication d'une annonce, réservation, versement) peuvent être subordonnées à
          la vérification de l'identité ou à la fourniture de justificatifs.
        </p>
      </Article>

      <Article numero="5" titre="Obligations de l'hôte">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Publier une annonce sincère : photos, superficie, équipements, capacité et
            localisation doivent correspondre à la réalité du bien.
          </li>
          <li>
            Disposer du droit de louer le bien et respecter la réglementation applicable :
            autorisation de changement d'usage ou déclaration en mairie lorsqu'elle est
            requise, numéro d'enregistrement, règlement de copropriété, accord du bailleur
            en cas de sous-location.
          </li>
          <li>
            Déclarer les revenus perçus et s'acquitter des obligations fiscales et
            sociales correspondantes, ainsi que de la taxe de séjour lorsqu'elle est due.
          </li>
          <li>
            Souscrire les assurances adaptées à son activité de location et maintenir le
            logement conforme aux règles de sécurité et de salubrité.
          </li>
          <li>
            Tenir son calendrier à jour, y compris en cas de synchronisation avec une
            plateforme tierce, et honorer les réservations confirmées.
          </li>
        </ul>
      </Article>

      <Article numero="6" titre="Obligations du voyageur">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Utiliser le logement en bon père de famille et respecter les règles fixées par l'hôte.</li>
          <li>Ne pas dépasser la capacité d'accueil annoncée ni sous-louer le logement.</li>
          <li>Signaler à l'hôte tout dommage ou dysfonctionnement dans les meilleurs délais.</li>
          <li>Restituer le logement dans l'état dans lequel il l'a trouvé, usure normale exceptée.</li>
        </ul>
      </Article>

      <Article numero="7" titre="Réservation, prix et commission">
        <p>
          Le prix affiché comprend le tarif fixé par l'hôte, les options éventuellement
          sélectionnées et la commission d'Escale. Le montant total est présenté au
          voyageur avant tout paiement : aucun frais supplémentaire n'est ajouté après
          confirmation.
        </p>
        <p>
          Selon le réglage choisi par l'hôte, la réservation est confirmée immédiatement ou
          après validation de sa part. La confirmation vaut conclusion du contrat de
          location entre l'hôte et le voyageur.
        </p>
      </Article>

      <Article numero="8" titre="Paiement séquestré et versement à l'hôte">
        <p>
          Le paiement est encaissé au moment de la réservation par notre prestataire de
          services de paiement, puis conservé jusqu'à la fin du séjour. Les fonds sont
          versés à l'hôte le lendemain de la fin du séjour, sous réserve qu'aucun
          signalement ne soit en cours sur la réservation.
        </p>
        <p>
          Lorsque l'hôte exige une caution, celle-ci fait l'objet d'une empreinte bancaire
          préautorisée avant l'arrivée. Elle est libérée après le séjour, ou débitée en
          tout ou partie en cas de dommage justifié, dans les limites du montant annoncé.
        </p>
      </Article>

      <Article numero="9" titre="Annulation">
        <p>
          Les conditions d'annulation applicables sont celles indiquées dans l'annonce et
          rappelées au voyageur avant le paiement. En cas d'annulation par l'hôte d'une
          réservation confirmée, le voyageur est intégralement remboursé des sommes
          versées.
        </p>
        <p>
          S'agissant de prestations d'hébergement fournies à une date déterminée, le droit
          de rétractation de quatorze jours prévu par le Code de la consommation ne
          s'applique pas (art. L.221-28, 12°).
        </p>
      </Article>

      <Article numero="10" titre="Signalements et médiation">
        <p>
          L'hôte comme le voyageur peuvent signaler un problème avant le reversement des
          fonds. Le signalement suspend le versement le temps de l'instruction. L'équipe
          Escale examine les éléments transmis par les deux parties et décide de libérer
          les fonds, de rembourser tout ou partie du séjour au voyageur, ou de clore le
          signalement.
        </p>
        <p>
          Cette procédure interne est un service de facilitation. Elle ne prive aucune
          partie de son droit d'agir en justice ni de saisir un médiateur.
        </p>
      </Article>

      <Article numero="11" titre="Contenus publiés et avis">
        <p>
          L'utilisateur reste titulaire des droits sur les contenus qu'il publie (textes,
          photos) et concède à Escale une licence gratuite et non exclusive pour les
          afficher et les promouvoir dans le cadre du service, pour la durée de leur
          publication.
        </p>
        <p>
          Les avis ne peuvent être déposés que par un voyageur ayant effectivement séjourné
          dans le logement. Escale ne modifie pas les avis et n'en retire que ceux qui sont
          manifestement illicites, injurieux ou sans rapport avec le séjour.
        </p>
      </Article>

      <Article numero="12" titre="Responsabilité">
        <p>
          Escale est responsable du bon fonctionnement de son service de mise en relation
          et d'encaissement. Elle ne répond pas de la conformité du logement, du
          comportement des utilisateurs, ni de l'exécution du contrat de location, qui
          relèvent de l'hôte et du voyageur.
        </p>
        <p>
          Escale met en œuvre les moyens raisonnables pour assurer la disponibilité de la
          plateforme, sans garantir une accessibilité ininterrompue, notamment en cas de
          maintenance ou de défaillance d'un prestataire tiers.
        </p>
      </Article>

      <Article numero="13" titre="Suspension et résiliation">
        <p>
          L'utilisateur peut fermer son compte à tout moment ; les réservations en cours
          restent dues et doivent être honorées. Escale peut suspendre ou fermer un compte
          en cas de manquement grave aux présentes conditions, de fraude, ou d'atteinte à
          la sécurité des autres utilisateurs, après information de l'intéressé sauf
          urgence ou obligation légale contraire.
        </p>
      </Article>

      <Article numero="14" titre="Données personnelles">
        <p>
          Le traitement des données personnelles est décrit dans notre{" "}
          <Link href="/confidentialite" className="text-[#2F6E6E] underline hover:text-[#1B3A3A]">
            politique de confidentialité
          </Link>
          . Toute question peut être adressée à {CONTACTS.donnees}.
        </p>
      </Article>

      <Article numero="15" titre="Modification des conditions">
        <p>
          Escale peut modifier les présentes conditions. Les utilisateurs sont informés des
          modifications substantielles avant leur entrée en vigueur. Les réservations déjà
          confirmées restent régies par les conditions en vigueur au jour de la
          réservation.
        </p>
      </Article>

      <Article numero="16" titre="Droit applicable et règlement des litiges">
        <p>
          Les présentes conditions sont soumises au droit français. En cas de litige, une
          solution amiable sera recherchée en priorité en écrivant à {CONTACTS.litiges}.
        </p>
        <p>
          Conformément à l'article L.612-1 du Code de la consommation, tout consommateur
          peut recourir gratuitement au médiateur de la consommation :{" "}
          {MEDIATEUR.nom} — {MEDIATEUR.site}. La plateforme européenne de règlement en
          ligne des litiges est également accessible à l'adresse{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            className="text-[#2F6E6E] underline hover:text-[#1B3A3A]"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Article>
    </PageLegale>
  );
}
