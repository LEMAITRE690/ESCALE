// Régénère docs/CGU_Escale.pdf.
//
// Le PDF était jusqu'ici un binaire committé sans source : toute correction
// juridique supposait de le reconstruire à la main. Ce script en fait un
// artefact reproductible, dont le texte est versionné ci-dessous et dont les
// taux proviennent de lib/pricing.json — la même source que l'application.
//
// Usage : node scripts/generer-cgu-pdf.mjs

import PDFDocument from "pdfkit";
import { createWriteStream, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, "..");
const SORTIE = join(RACINE, "docs", "CGU_Escale.pdf");

const t = JSON.parse(readFileSync(join(RACINE, "lib", "pricing.json"), "utf8"));

// Miroir de formatTaux() de lib/pricing.ts. Les zéros terminaux ne se retirent
// qu'après une virgule décimale : sans cette garde, « 20 » deviendrait « 2 ».
const pct = (taux, decimales = 2) => {
  const brut = (taux * 100).toFixed(decimales);
  const nettoye = brut.includes(".") ? brut.replace(/0+$/, "").replace(/\.$/, "") : brut;
  return `${nettoye.replace(".", ",")} %`;
};
const eur = (montant) => `${String(montant).replace(".", ",")} €`;

const COMMISSION = pct(t.COMMISSION_RATE_TTC);
const COMMISSION_HT = pct(t.COMMISSION_RATE_HT);
const ABO_FIXE = eur(t.SUBSCRIPTION_FEE_TTC);
const ABO_FIXE_HT = eur(t.SUBSCRIPTION_FEE_HT);
const ABO_TAUX = pct(t.SUBSCRIPTION_RATE_TTC);
const ABO_TAUX_HT = pct(t.SUBSCRIPTION_RATE_HT);
const RETRO = pct(t.CONCIERGERIE_RETROCOMMISSION);
const NET_PARTENAIRE = pct(t.COMMISSION_RATE_TTC - t.CONCIERGERIE_RETROCOMMISSION);
const TVA = pct(t.VAT_RATE, 0);

const TITRE = "Conditions Générales d'Utilisation";
const SOUS_TITRE = "Plateforme Escale — mise en relation entre hôtes et voyageurs";

const AVERTISSEMENT =
  "Document de travail. Ce projet de CGU a été élaboré à partir de principes juridiques " +
  "généraux applicables aux plateformes de mise en relation entre particuliers. Il ne " +
  "constitue pas un conseil juridique et doit impérativement être relu et validé par un " +
  "avocat spécialisé en droit du numérique avant toute mise en ligne, notamment pour " +
  "vérifier sa conformité au Code de la consommation, au RGPD, à la LCEN et à la " +
  "réglementation locale sur les meublés de tourisme.";

// Chaque article : { n, titre, blocs: [string | {liste: [string]}] }
const ARTICLES = [
  {
    n: 1,
    titre: "Objet",
    blocs: [
      "Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions d'utilisation de la plateforme Escale (ci-après « la Plateforme »), ainsi que de définir les droits et obligations des parties dans ce cadre. La Plateforme propose un service de mise en relation en ligne entre des personnes souhaitant proposer un logement à la location de courte ou moyenne durée (ci-après « les Hôtes ») et des personnes souhaitant réserver un tel logement (ci-après « les Voyageurs »).",
    ],
  },
  {
    n: 2,
    titre: "Statut de la Plateforme : un rôle d'intermédiaire technique",
    blocs: [
      "Escale agit exclusivement en qualité d'intermédiaire technique de mise en relation entre Hôtes et Voyageurs. La Plateforme n'est ni propriétaire, ni gestionnaire, ni exploitant des logements proposés à la location, et n'est à aucun moment locataire ou sous-locataire du bien.",
      "Le contrat de location conclu à l'issue d'une réservation est formé exclusivement entre l'Hôte et le Voyageur. Escale n'est pas partie à ce contrat et n'intervient ni dans sa négociation, ni dans son exécution, ni dans le respect des obligations réciproques des parties.",
      "Escale n'effectue aucune vérification physique des logements publiés. Les informations figurant dans les annonces (description, photographies, équipements, tarifs, options de séjour, conditions d'annulation) sont déclarées par l'Hôte et relèvent de sa seule responsabilité. Escale ne garantit ni leur exactitude ni leur conformité à la réalité du bien.",
      "Le rôle d'intermédiaire d'Escale s'étend à la gestion technique des paiements, décrite à l'Article 10 : cette fonction de facilitation ne fait pas d'Escale une partie au contrat de location, ni un dépositaire au sens juridique du terme, ni un garant de la bonne exécution du séjour par l'une ou l'autre des parties.",
    ],
  },
  {
    n: 3,
    titre: "Obligations de l'Hôte",
    blocs: [
      "L'Hôte garantit être titulaire des droits nécessaires pour proposer le logement à la location (propriétaire, mandataire dûment autorisé, ou locataire ayant obtenu l'accord exprès de son bailleur pour toute sous-location).",
      "L'Hôte s'engage à fournir une description exacte, complète et à jour de son logement, et à respecter l'ensemble des obligations légales et réglementaires applicables à la location de meublés de tourisme (déclaration en mairie le cas échéant, numéro d'enregistrement, réglementation locale, fiscalité applicable aux revenus locatifs).",
      "L'Hôte demeure seul responsable de la souscription des assurances adaptées à son activité de location (assurance habitation avec clause villégiature, assurance Propriétaire Non Occupant selon les cas). Escale l'invite à vérifier cette couverture avant toute publication d'annonce mais ne saurait se substituer à cette obligation.",
      "L'Hôte détermine librement, pour chaque annonce, les options et conditions applicables au séjour : acceptation ou non des animaux, frais de ménage, possibilité d'arrivée anticipée ou de départ tardif (avec ou sans supplément), durée minimale et maximale de séjour, mode de réservation (instantanée ou soumise à validation), accueil des enfants, tolérance au tabac, autorisation d'événements, politique d'annulation choisie parmi celles proposées par la Plateforme, et montant d'un éventuel dépôt de garantie. L'Hôte est seul responsable de l'exactitude de ces informations et de leur application effective lors du séjour ; Escale se borne à les afficher telles que déclarées et à les faire respecter dans les outils de réservation et de facturation.",
    ],
  },
  {
    n: 4,
    titre: "Obligations du Voyageur",
    blocs: [
      "Le Voyageur s'engage à utiliser le logement loué conformément à sa destination et aux conditions convenues avec l'Hôte, notamment les options et règles de séjour affichées sur l'annonce au moment de la réservation (animaux, horaires, nombre de voyageurs, tabac, événements), et à restituer le logement en bon état à l'issue du séjour.",
      "Le Voyageur est seul responsable des dommages qu'il pourrait causer au logement ou à ses équipements durant son séjour, dans les conditions prévues par le contrat de location conclu avec l'Hôte et par la politique d'annulation et de dépôt de garantie applicables à l'annonce réservée.",
    ],
  },
  {
    n: 5,
    titre: "Limitation de responsabilité de la Plateforme",
    blocs: [
      "Dans les limites autorisées par la loi, Escale ne saurait être tenue responsable :",
      {
        liste: [
          "de l'inexactitude, l'imprécision ou le caractère mensonger des informations publiées dans une annonce par un Hôte ;",
          "de la non-conformité du logement à sa description, de son état, de sa sécurité ou de sa salubrité ;",
          "de l'inexécution ou de la mauvaise exécution du contrat de location par l'une ou l'autre des parties ;",
          "des dommages, pertes, vols ou préjudices corporels survenus à l'occasion d'un séjour ;",
          "des litiges relatifs au paiement, au remboursement ou à l'annulation d'une réservation, lesquels relèvent en premier lieu de l'accord entre l'Hôte et le Voyageur.",
        ],
      },
    ],
  },
  {
    n: 6,
    titre: "Portée de la limitation de responsabilité",
    blocs: [
      "Conformément à l'article L212-1 du Code de la consommation, la présente clause ne saurait avoir pour effet de créer un déséquilibre significatif au détriment des utilisateurs consommateurs. Elle ne prive en aucun cas l'Hôte ou le Voyageur de leurs recours de droit commun à l'encontre de l'autre partie ou, le cas échéant, à l'encontre d'Escale en cas de manquement avéré de la Plateforme à ses propres obligations (disponibilité du service, sécurité des paiements, protection des données personnelles).",
      "Cette limitation ne saurait davantage exonérer Escale de sa responsabilité en cas de faute prouvée dans l'exercice de ses propres missions, ni en cas d'infraction pénale dont elle aurait connaissance et qu'elle n'aurait pas signalée conformément à ses obligations légales.",
    ],
  },
  {
    n: 7,
    titre: "Procédure de signalement et de médiation",
    blocs: [
      "En cas de différend entre un Hôte et un Voyageur, les parties sont invitées à rechercher en priorité une résolution amiable, par écrit, en conservant une trace des échanges (messagerie de la Plateforme, courriel).",
      "Si le différend persiste, l'utilisateur peut saisir le service client d'Escale via le formulaire de signalement disponible dans son espace personnel, en précisant les faits, la date de la réservation et, si possible, les justificatifs (photographies, échanges antérieurs). Escale peut alors proposer une médiation entre les parties, sans que cette intervention ne constitue une garantie de résultat ni un engagement de prise en charge financière du litige.",
      "Conformément à la réglementation relative à la médiation de la consommation, tout utilisateur consommateur dispose par ailleurs de la faculté de recourir gratuitement à un médiateur de la consommation en cas d'échec de la réclamation écrite préalable auprès d'Escale.",
    ],
  },
  {
    n: 8,
    titre: "Signalement de contenus illicites",
    blocs: [
      "Conformément à l'article 6-I-5 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), tout utilisateur peut signaler à Escale une annonce ou un contenu qu'il estime illicite via le formulaire dédié. Escale s'engage à traiter ce signalement dans les meilleurs délais et à retirer promptement tout contenu manifestement illicite porté à sa connaissance.",
    ],
  },
  {
    n: 9,
    titre: "Assurances Escale",
    blocs: [
      "[décrire ici, le cas échéant, la garantie ou l'assurance complémentaire proposée par la Plateforme, ses plafonds et ses exclusions]. Cette garantie, si elle existe, constitue un complément et ne se substitue en aucun cas à l'assurance habitation ou Propriétaire Non Occupant que l'Hôte doit souscrire à titre personnel, ni à une assurance voyage éventuelle du Voyageur.",
    ],
  },
  {
    n: 10,
    titre: "Paiement, séquestre et reversement à l'Hôte",
    blocs: [
      "Les paiements effectués par le Voyageur transitent par un prestataire de paiement tiers agréé (Stripe), au moyen duquel Escale opère une simple fonction technique de collecte et de répartition des fonds. Escale n'a accès à aucune donnée bancaire sensible du Voyageur.",
      "Le montant réglé par le Voyageur à la réservation est conservé par l'intermédiaire du prestataire de paiement jusqu'au lendemain de la date de fin du séjour. Ce délai de rétention a pour seul objet de limiter les risques de fraude et d'annonces non conformes, en laissant au Voyageur la possibilité de signaler un problème avant tout reversement à l'Hôte ; il ne confère à Escale ni la propriété des fonds, ni la qualité de séquestre ou de dépositaire au sens juridique du terme, ni celle d'établissement de paiement — cette fonction demeure assurée exclusivement par le prestataire de paiement agréé.",
      "À l'expiration de ce délai, et en l'absence de signalement en cours au sens de l'Article 7, le montant dû à l'Hôte — déduction faite de la commission Escale et, le cas échéant, du dépôt de garantie mentionné à l'annonce — lui est reversé automatiquement sur le compte bancaire qu'il a déclaré lors de la configuration de son compte de paiement.",
      "En cas de signalement en cours sur une réservation, le reversement à l'Hôte est suspendu jusqu'à l'issue de la procédure de médiation prévue à l'Article 7. Selon l'issue de cette procédure, Escale peut, sur cette seule base et sans que sa propre responsabilité contractuelle en soit engagée, soit débloquer le reversement à l'Hôte, soit procéder au remboursement total ou partiel du Voyageur, conformément à la politique d'annulation applicable à l'annonce et au dépôt de garantie éventuellement prévu.",
      "Escale ne saurait être tenue responsable d'un incident technique imputable au prestataire de paiement, sous réserve des recours que l'utilisateur pourrait exercer directement à l'encontre de ce dernier.",
    ],
  },
  {
    n: 11,
    titre: "Politique d'annulation et dépôt de garantie",
    blocs: [
      "Chaque annonce précise la politique d'annulation choisie par l'Hôte parmi celles proposées par la Plateforme (flexible, modérée, stricte, très stricte ou non remboursable), ainsi que, le cas échéant, le montant d'un dépôt de garantie. Ces conditions, affichées au Voyageur avant toute réservation, engagent les parties au contrat de location ; Escale se limite à les appliquer techniquement lors du calcul des remboursements et n'en est ni l'auteur ni le garant.",
      "Le dépôt de garantie, lorsqu'il est prévu, fait l'objet d'une simple autorisation bancaire sur le moyen de paiement du Voyageur : il n'est pas prélevé à la réservation et ne transite pas par les comptes d'Escale, sauf constat de dommage donnant lieu à un débit dans les conditions prévues par le contrat de location et, le cas échéant, la procédure de l'Article 7.",
      "L'attention de l'Hôte est appelée sur le fait qu'une politique d'annulation stricte ou non remboursable, opposable au Voyageur consommateur, doit rester compatible avec les règles d'ordre public applicables (notamment en cas d'empêchement du Voyageur pour un motif légitime ou de logement non conforme à l'annonce) ; Escale ne garantit pas l'opposabilité de ces politiques en toutes circonstances et invite l'Hôte à s'assurer de leur validité auprès d'un professionnel du droit.",
    ],
  },
  {
    n: 12,
    titre: "Commission d'Escale, partenaires apporteurs d'affaires et rétrocommission",
    blocs: [
      "La rémunération d'Escale est constituée d'une commission supportée par l'Hôte et prélevée sur chaque réservation confirmée. Aucun frais de service n'est facturé au Voyageur, à quelque titre que ce soit : le montant affiché avant paiement est le montant définitivement dû par celui-ci.",
      "Le taux applicable dépend de la formule à laquelle l'Hôte est rattaché :",
      {
        liste: [
          `Formule Commission : ${COMMISSION} du montant du séjour, sans abonnement.`,
          `Formule Abonnement : ${ABO_FIXE} par mois, augmentés de ${ABO_TAUX} du montant du séjour.`,
        ],
      },
      `Escale est assujettie à la taxe sur la valeur ajoutée. Les taux et montants ci-dessus s'entendent toutes taxes comprises, au taux de TVA en vigueur de ${TVA} ; aucun montant ne s'y ajoute à ce titre. Leurs équivalents hors taxes sont, à titre indicatif, de ${COMMISSION_HT} pour la formule Commission et de ${ABO_FIXE_HT} par mois majorés de ${ABO_TAUX_HT} pour la formule Abonnement. En cas de modification du taux légal de TVA, les taux toutes taxes comprises sont ajustés à due concurrence.`,
      "La taxe de séjour, collectée pour le compte de la commune et intégralement reversée à l'Hôte qui demeure redevable de sa déclaration et de son versement, est exclue de l'assiette de la commission.",
      "Escale peut par ailleurs nouer des partenariats avec des professionnels de la gestion locative (conciergeries notamment) qui orientent des Hôtes vers la Plateforme. Un Hôte peut renseigner, une seule fois et à titre facultatif, le code d'un partenaire l'ayant orienté vers Escale.",
      `Ce rattachement n'a aucune incidence sur les sommes dues par le Voyageur ni sur le montant reversé à l'Hôte : il conditionne uniquement la répartition interne de la commission perçue par Escale entre elle-même et le partenaire concerné, à titre de rétrocommission commerciale. Dans ce cas, ${RETRO} du montant du séjour revient au partenaire et Escale conserve ${NET_PARTENAIRE}. Le partenaire n'est partie ni au contrat de location ni aux présentes CGU du seul fait de ce rattachement.`,
    ],
  },
  {
    n: 13,
    titre: "Contact direct et respect du rôle d'Escale",
    blocs: [
      "La messagerie mise à disposition entre l'Hôte et le Voyageur a pour seule finalité l'organisation du séjour réservé via la Plateforme. Les utilisateurs s'engagent à ne pas échanger leurs coordonnées personnelles (numéro de téléphone, adresse e-mail, identifiants de réseaux sociaux ou de messageries tierces) dans le but de conclure, directement ou pour une réservation ultérieure, une location en dehors d'Escale.",
      "Afin de limiter ces pratiques, Escale peut mettre en œuvre un filtrage automatique des messages échangés, destiné à détecter et masquer ce type de coordonnées avant leur affichage à l'autre partie. Ce filtrage constitue une mesure de prévention et non une garantie absolue ; il ne saurait engager la responsabilité d'Escale en cas de contournement malgré cette mesure.",
      "Toute réservation conclue en dehors d'Escale, alors que la mise en relation initiale a eu lieu sur la Plateforme, prive les deux parties des protections offertes par Escale (paiement séquestré, médiation, assurance des transactions) et peut donner lieu à la suspension du compte de l'utilisateur à l'origine du contournement, dans les conditions prévues à l'Article 14.",
    ],
  },
  {
    n: 14,
    titre: "Suspension et résiliation",
    blocs: [
      "Escale se réserve le droit de suspendre ou de supprimer, à tout moment et sans préavis, tout compte ou toute annonce ne respectant pas les présentes CGU, la réglementation en vigueur, ou faisant l'objet de signalements répétés et fondés.",
    ],
  },
  {
    n: 15,
    titre: "Droit applicable et juridiction compétente",
    blocs: [
      "Les présentes CGU sont soumises au droit français. En cas de litige avec Escale et à défaut de résolution amiable ou de médiation, les tribunaux français compétents seront seuls habilités à connaître du litige, sous réserve des règles impératives de protection du consommateur applicables.",
    ],
  },
  {
    n: 16,
    titre: "Contact",
    blocs: [
      "Pour toute question relative aux présentes CGU ou pour effectuer un signalement, l'utilisateur peut contacter Escale à l'adresse [adresse e-mail de contact à compléter].",
    ],
  },
];

const ENCRE = "#1B3A3A";
const TEXTE = "#3F3A33";
const DISCRET = "#7A6E5F";

mkdirSync(dirname(SORTIE), { recursive: true });

const doc = new PDFDocument({ size: "A4", margin: 56 });
doc.pipe(createWriteStream(SORTIE));

doc.font("Helvetica-Bold").fontSize(18).fillColor(ENCRE).text(TITRE);
doc.moveDown(0.3);
doc.font("Helvetica").fontSize(11).fillColor(DISCRET).text(SOUS_TITRE);
doc.moveDown(1);

doc.font("Helvetica-Oblique").fontSize(9).fillColor(DISCRET).text(AVERTISSEMENT, {
  align: "justify",
});
doc.moveDown(1.2);

for (const article of ARTICLES) {
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(ENCRE)
    .text(`Article ${article.n} — ${article.titre}`);
  doc.moveDown(0.4);

  for (const bloc of article.blocs) {
    if (typeof bloc === "string") {
      doc.font("Helvetica").fontSize(10).fillColor(TEXTE).text(bloc, { align: "justify" });
      doc.moveDown(0.5);
    } else {
      for (const item of bloc.liste) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(TEXTE)
          .text(`•  ${item}`, { align: "justify", indent: 12 });
        doc.moveDown(0.3);
      }
      doc.moveDown(0.2);
    }
  }

  doc.moveDown(0.6);
}

doc.end();
console.log(`CGU générées : ${SORTIE}`);
