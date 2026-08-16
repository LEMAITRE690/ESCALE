import PDFDocument from "pdfkit";
import { SOCIETE, CONTRAT_APPORTEUR } from "@/lib/informations-legales";
import {
  COMMISSION_RATE_TTC,
  COMMISSION_RATE_TTC_NET_PARTENAIRE,
  CONCIERGERIE_RETROCOMMISSION,
  CONCIERGERIE_RETROCOMMISSION_ABONNEMENT,
  formatTaux,
} from "@/lib/pricing";

// Contrat d'apporteur d'affaires entre Escale et une conciergerie partenaire.
//
// Toutes les variables du modèle sont substituées : identité d'Escale depuis
// lib/informations-legales.js, identité de la conciergerie depuis sa fiche en
// base, et taux depuis lib/pricing.json — jamais réécrits ici.

export type DonneesContratApporteur = {
  conciergerie: {
    legalName: string;
    legalForm: string;
    siret: string;
    registeredAddress: string;
    repName: string;
    repRole: string;
  };
  /** Date de signature. Laissée vide sur un contrat prégénéré non signé. */
  dateSignature?: string | null;
};

/** « un (1) point », « zéro virgule cinq (0,5) point » — comme au modèle. */
function pointsEnLettres(taux: number): string {
  const points = Math.round(taux * 1000) / 10;
  const litteral: Record<string, string> = {
    "0.5": "zéro virgule cinq (0,5)",
    "1": "un (1)",
    "1.5": "un virgule cinq (1,5)",
    "2": "deux (2)",
  };
  const cle = String(points);
  const mots = litteral[cle] ?? `${String(points).replace(".", ",")}`;
  return `${mots} point${points > 1 ? "s" : ""}`;
}

function joursEnLettres(n: number): string {
  const litteral: Record<number, string> = { 15: "quinze", 30: "trente", 60: "soixante", 90: "quatre-vingt-dix" };
  return litteral[n] ? `${litteral[n]} (${n})` : String(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Bloc = string | { liste: string[] };

function articles(d: DonneesContratApporteur): Array<{ n: number; titre: string; blocs: Bloc[] }> {
  const c = d.conciergerie;

  return [
    {
      n: 1,
      titre: "Objet",
      blocs: [
        "Le présent contrat a pour objet de définir les conditions dans lesquelles l'Apporteur met en relation des Hôtes avec la Plateforme, ainsi que les modalités de la rémunération versée par la Plateforme à l'Apporteur en contrepartie de cet apport.",
      ],
    },
    {
      n: 2,
      titre: "Nature de la mission de l'Apporteur",
      blocs: [
        "L'Apporteur agit en qualité d'intermédiaire indépendant et non exclusif. Le présent contrat ne constitue ni un mandat, ni un contrat d'agent commercial au sens des articles L. 134-1 et suivants du Code de commerce, ni un contrat de travail.",
        "En particulier, l'Apporteur :",
        {
          liste: [
            "ne dispose d'aucun pouvoir de représentation, de négociation ou de conclusion de contrat au nom et pour le compte de la Plateforme ;",
            "n'engage la Plateforme vis-à-vis des Hôtes, des voyageurs ou de tout tiers, sous quelque forme que ce soit ;",
            "ne reçoit de la Plateforme aucune instruction quant à l'organisation de son activité, aux modalités de sa prospection ou à la gestion de sa clientèle ;",
            "gère les annonces des Hôtes qui lui confient cette mission dans le cadre de mandats distincts, conclus directement entre l'Apporteur et chaque Hôte, auxquels la Plateforme est étrangère.",
          ],
        },
        "Les Parties conviennent que toute évolution des conditions d'exécution du présent contrat qui contreviendrait aux principes énoncés au présent article devra faire l'objet d'un avenant, à défaut de quoi les stipulations du présent article prévaudront sur toute pratique contraire.",
      ],
    },
    {
      n: 3,
      titre: "Statut « Super-hôte »",
      blocs: [
        "L'octroi, le maintien et la révocation du statut « Super-hôte », qui permet à l'Apporteur d'accéder à la gestion des annonces des Hôtes qui lui sont rattachés sur la Plateforme, sont régis par les conditions générales d'utilisation de la Plateforme. Ce statut peut être accordé ou retiré par la Plateforme indépendamment du présent contrat, notamment en cas de manquement de l'Apporteur à ses obligations envers un Hôte ou envers la Plateforme.",
        "La révocation du statut Super-hôte sur une annonce déterminée met fin, pour cette seule annonce, au droit à rétrocommission prévu à l'article 5, sans emporter résiliation du présent contrat.",
      ],
    },
    {
      n: 4,
      titre: "Preuve de l'apport",
      blocs: [
        "Est réputé apporté par l'Apporteur tout Hôte dont l'inscription et la publication d'annonce sur la Plateforme résultent de l'octroi, sur cette annonce, du statut Super-hôte au bénéfice de l'Apporteur, tel qu'enregistré dans les systèmes de la Plateforme à la date de chaque réservation. Cet enregistrement fait foi entre les Parties, sauf preuve contraire.",
      ],
    },
    {
      n: 5,
      titre: "Rémunération",
      blocs: [
        `En contrepartie de l'apport défini à l'article 4, l'Apporteur perçoit une rétrocommission égale à ${pointsEnLettres(
          CONCIERGERIE_RETROCOMMISSION
        )} de commission, hors taxes, sur le montant de chaque réservation confirmée et payée portant sur une annonce pour laquelle il dispose du statut Super-hôte actif à la date de la réservation.`,
        `À la date de signature du présent contrat, pour un Hôte relevant de la formule Commission de la Plateforme, la commission perçue par la Plateforme sur les réservations est fixée à ${formatTaux(
          COMMISSION_RATE_TTC
        )} toutes taxes comprises, dont ${formatTaux(
          COMMISSION_RATE_TTC_NET_PARTENAIRE
        )} conservés par la Plateforme et ${formatTaux(
          CONCIERGERIE_RETROCOMMISSION
        )}, hors taxes, reversés à l'Apporteur au titre du présent article. Toute évolution ultérieure du taux global de commission appliqué par la Plateforme est sans effet sur le point de commission contractuellement réservé à l'Apporteur, sauf avenant signé des deux Parties.`,
        "La rétrocommission n'est due que pour les réservations dont la date de séjour est postérieure à la date d'octroi du statut Super-hôte sur l'annonce concernée, et cesse d'être due pour toute réservation dont la date de séjour est postérieure à la perte de ce statut.",
        `Lorsque l'Hôte relève de la formule Abonnement de la Plateforme (frais fixe mensuel majoré d'une part variable), l'Apporteur perçoit, pour les réservations concernées, une rétrocommission réduite à ${pointsEnLettres(
          CONCIERGERIE_RETROCOMMISSION_ABONNEMENT
        )} de commission, hors taxes, assise sur la seule part variable prélevée par la Plateforme au titre de cette réservation. La part fixe mensuelle de l'abonnement, due par l'Hôte indépendamment du nombre de réservations, n'entre pas dans l'assiette de la rétrocommission et reste intégralement conservée par la Plateforme.`,
      ],
    },
    {
      n: 6,
      titre: "Facturation, paiement et régime de TVA",
      blocs: [
        "L'Apporteur déclare être immatriculé de façon indépendante et seul responsable, à ce titre, de ses obligations sociales et fiscales. Le montant, hors taxes, des rétrocommissions dues est calculé automatiquement par la Plateforme et mis à disposition de l'Apporteur dans son espace partenaire dédié.",
        "L'Apporteur adresse mensuellement à la Plateforme une facture correspondant à ce montant hors taxes, établie selon son propre régime de TVA :",
        {
          liste: [
            "si l'Apporteur est assujetti à la TVA, la facture fait apparaître le montant hors taxes, la TVA au taux en vigueur, et le montant toutes taxes comprises ;",
            "si l'Apporteur relève du régime de la franchise en base de TVA, la facture porte la mention légale correspondante (« TVA non applicable, article 293 B du Code général des impôts ») et aucune TVA n'est due par la Plateforme.",
          ],
        },
        "L'Apporteur s'engage à informer la Plateforme sans délai de tout changement de son régime de TVA, notamment en cas de dépassement des seuils de la franchise en base, et à établir ses factures en conséquence à compter de la date d'effet de ce changement.",
        `La Plateforme procède au règlement du montant figurant sur la facture, taxes comprises le cas échéant, dans un délai de ${joursEnLettres(
          CONTRAT_APPORTEUR.delaiPaiementJours
        )} jours à compter de la réception de la facture, par virement sur le compte bancaire désigné par l'Apporteur.`,
      ],
    },
    {
      n: 7,
      titre: "Durée et résiliation",
      blocs: [
        "Le présent contrat est conclu pour une durée indéterminée à compter de sa date de signature.",
        `Chaque Partie peut y mettre fin à tout moment, sans avoir à justifier de motif, moyennant un préavis écrit notifié par lettre recommandée avec accusé de réception ou tout autre moyen conférant date certaine, d'une durée de ${joursEnLettres(
          CONTRAT_APPORTEUR.preavisResiliationJours
        )} jours. Le courrier de résiliation précise la date d'échéance du contrat.`,
        "La résiliation du présent contrat n'ouvre droit, au bénéfice de l'Apporteur, à aucune indemnité autre que le paiement des rétrocommissions acquises à la date d'effet de la résiliation au titre de réservations déjà confirmées. Elle entraîne de plein droit la révocation du statut Super-hôte de l'Apporteur sur l'ensemble des annonces qui lui sont rattachées.",
      ],
    },
    {
      n: 8,
      titre: "Non-exclusivité",
      blocs: [
        "Le présent contrat ne confère à l'Apporteur aucune exclusivité, territoriale ou sectorielle. La Plateforme demeure libre de conclure des accords équivalents avec toute autre conciergerie ou tout autre apporteur, sans que cela ouvre droit à indemnité au profit de l'Apporteur.",
      ],
    },
    {
      n: 9,
      titre: "Indépendance des Parties",
      blocs: [
        "Les Parties agissent en qualité de professionnels indépendants. Le présent contrat n'emporte, entre les Parties, ni lien de subordination, ni mandat d'intérêt commun, ni société de fait, ni contrat de travail. L'Apporteur conserve l'entière liberté d'organiser son activité, y compris au bénéfice d'autres plateformes ou donneurs d'ordre.",
      ],
    },
    {
      n: 10,
      titre: "Confidentialité",
      blocs: [
        "Chaque Partie s'engage à conserver strictement confidentielles les informations de nature commerciale, financière ou technique dont elle aurait connaissance à l'occasion de l'exécution du présent contrat, et à ne les utiliser qu'aux fins de son exécution.",
      ],
    },
    {
      n: 11,
      titre: "Droit applicable et litiges",
      blocs: [
        `Le présent contrat est soumis au droit français. Les Parties s'efforceront de résoudre à l'amiable tout différend relatif à sa formation, son interprétation, son exécution ou sa résiliation. À défaut d'accord amiable dans un délai de ${joursEnLettres(
          CONTRAT_APPORTEUR.delaiAmiableJours
        )} jours, le litige sera soumis à la compétence des tribunaux du ressort du siège social de la Plateforme, sauf disposition d'ordre public contraire.`,
      ],
    },
  ];
}

export async function genererContratApporteurPDF(
  d: DonneesContratApporteur
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const morceaux: Buffer[] = [];
    doc.on("data", (m) => morceaux.push(m));
    doc.on("end", () => resolve(Buffer.concat(morceaux)));
    doc.on("error", reject);

    const ENCRE = "#1B3A3A";
    const TEXTE = "#3F3A33";
    const DISCRET = "#7A6E5F";
    const G = doc.page.margins.left;
    const LARGEUR = doc.page.width - G * 2;
    const c = d.conciergerie;

    const paragraphe = (t: string, options: any = {}) => {
      doc.font("Helvetica").fontSize(9.5).fillColor(TEXTE).text(t, { align: "justify", ...options });
      doc.moveDown(0.45);
    };

    doc.font("Helvetica-Bold").fontSize(17).fillColor(ENCRE).text("Contrat d'apporteur d'affaires");
    doc.moveDown(0.8);

    doc
      .font("Helvetica-Oblique")
      .fontSize(8)
      .fillColor(DISCRET)
      .text(
        "PROJET DE CONTRAT — À FAIRE VALIDER PAR UN AVOCAT AVANT TOUTE SIGNATURE",
        { align: "center" }
      );
    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(10).fillColor(ENCRE).text("Entre les soussignés :");
    doc.moveDown(0.4);

    paragraphe(
      `La société ${SOCIETE.denomination}, ${SOCIETE.formeJuridique} au capital de ${SOCIETE.capital}, ` +
        `immatriculée au RCS de ${SOCIETE.rcsVille} sous le numéro ${SOCIETE.siren}, dont le siège social ` +
        `est situé ${SOCIETE.siege}, représentée par ${SOCIETE.representantLegal}, ` +
        `${SOCIETE.qualiteRepresentant}, ci-après « la Plateforme »,`
    );
    paragraphe("D'une part,");
    paragraphe(
      `Et ${c.legalName}, ${c.legalForm}, immatriculée sous le numéro SIRET ${c.siret}, dont le siège ` +
        `social est situé ${c.registeredAddress}, représentée par ${c.repName}, ${c.repRole}, ` +
        `ci-après « l'Apporteur »,`
    );
    paragraphe("D'autre part,");
    paragraphe("Ci-après désignées ensemble « les Parties ».");
    paragraphe("Il a été préalablement exposé ce qui suit.");
    doc.moveDown(0.6);

    doc.font("Helvetica-Bold").fontSize(11).fillColor(ENCRE).text("PRÉAMBULE");
    doc.moveDown(0.4);
    paragraphe(
      "La Plateforme exploite un service de mise en relation entre des hôtes proposant des logements à la " +
        "location de courte durée et des voyageurs. L'Apporteur exerce une activité de conciergerie et de " +
        "gestion locative pour le compte de propriétaires bailleurs (ci-après les « Hôtes »)."
    );
    paragraphe(
      "Dans le cadre de son activité, l'Apporteur peut mettre en relation avec la Plateforme des Hôtes qu'il " +
        "gère, en vue de la publication de leurs annonces sur la Plateforme. La Plateforme souhaite rémunérer " +
        "cet apport d'affaires selon les modalités définies au présent contrat."
    );
    paragraphe("Ceci exposé, il a été convenu ce qui suit.");
    doc.moveDown(0.6);

    for (const article of articles(d)) {
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(ENCRE)
        .text(`Article ${article.n} — ${article.titre}`);
      doc.moveDown(0.35);

      for (const bloc of article.blocs) {
        if (typeof bloc === "string") {
          paragraphe(bloc);
        } else {
          for (const item of bloc.liste) {
            paragraphe(`•  ${item}`, { indent: 12 });
          }
        }
      }
      doc.moveDown(0.5);
    }

    doc.moveDown(0.6);
    paragraphe(
      `Fait à ${CONTRAT_APPORTEUR.villeSignature}, le ` +
        `${d.dateSignature ? fmtDate(d.dateSignature) : "……………………"}, en deux exemplaires originaux.`
    );
    doc.moveDown(1.5);

    const colonne = (LARGEUR - 40) / 2;
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(ENCRE);
    doc.text("Pour la Plateforme", G, y, { width: colonne });
    doc.text("Pour l'Apporteur", G + colonne + 40, y, { width: colonne });

    const y2 = doc.y + 4;
    doc.font("Helvetica").fontSize(8.5).fillColor(DISCRET);
    doc.text(`${SOCIETE.representantLegal}, ${SOCIETE.qualiteRepresentant}`, G, y2, {
      width: colonne,
    });
    doc.text(`${c.repName}, ${c.repRole}`, G + colonne + 40, y2, { width: colonne });

    doc.end();
  });
}
