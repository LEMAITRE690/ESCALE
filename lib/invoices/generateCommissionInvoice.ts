import PDFDocument from "pdfkit";
import { SOCIETE, CONTACTS } from "@/lib/informations-legales";

// Facture de commission émise par Escale à un hôte.
//
// Escale étant assujettie à la TVA, la ventilation hors taxes / TVA / toutes
// taxes comprises est obligatoire sur chaque ligne comme en pied de facture.
// Les mentions d'identification de l'émetteur proviennent de
// lib/informations-legales.js : tant que ce fichier porte ses valeurs
// « À COMPLÉTER », les factures produites ne sont pas valables au sens de
// l'article 242 nonies A de l'annexe II au CGI.

export type DonneesFactureCommission = {
  numero: string;
  emiseLe: string;
  hote: {
    nom: string;
    email: string | null;
  };
  reservation: {
    id: string;
    logement: string;
    debut: string;
    fin: string;
    montantTotal: number; // en centimes, payé par le voyageur
    taxeSejour: number; // en centimes, exclue de l'assiette
  };
  montants: {
    ttc: number; // en centimes
    ht: number;
    tva: number;
    tauxTva: number; // 0.2
    platformFee: number;
    /**
     * Rétrocommission conciergerie. Conservée dans les données de la facture
     * pour la traçabilité comptable, mais jamais imprimée sur le document
     * remis à l'hôte : cette répartition est interne à Escale.
     */
    partnerFee: number;
  };
  reverseLe: string | null; // date du virement à l'hôte, si déjà effectué
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtEUR(centimes: number) {
  return (
    (centimes / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function fmtTaux(taux: number, decimales = 2) {
  const brut = (taux * 100).toFixed(decimales);
  const nettoye = brut.includes(".")
    ? brut.replace(/0+$/, "").replace(/\.$/, "")
    : brut;
  return `${nettoye.replace(".", ",")} %`;
}

export async function genererFactureCommissionPDF(
  d: DonneesFactureCommission
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const INK = "#1B3A3A";
    const MUTED = "#6B5B4D";
    const LIGNE = "#D8CCB0";
    const G = doc.page.margins.left;
    const LARGEUR = doc.page.width - G * 2;

    // En-tête
    doc.font("Helvetica-Bold").fontSize(20).fillColor(INK).text("Facture");
    doc.font("Helvetica").fontSize(10).fillColor(MUTED);
    doc.text(`N° ${d.numero}`);
    doc.text(`Émise le ${fmtDate(d.emiseLe)}`);
    doc.moveDown(1.2);

    // Émetteur / destinataire, sur deux colonnes
    const yBloc = doc.y;
    const colonne = (LARGEUR - 24) / 2;

    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("ÉMETTEUR", G, yBloc, {
      width: colonne,
    });
    doc.font("Helvetica").fontSize(9).fillColor(INK);
    doc.text(SOCIETE.denomination, { width: colonne });
    doc.fillColor(MUTED);
    doc.text(SOCIETE.formeJuridique, { width: colonne });
    doc.text(SOCIETE.siege, { width: colonne });
    doc.text(`SIRET ${SOCIETE.siret}`, { width: colonne });
    doc.text(`TVA ${SOCIETE.tva}`, { width: colonne });
    doc.text(CONTACTS.general, { width: colonne });
    const finGauche = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(MUTED)
      .text("FACTURÉ À", G + colonne + 24, yBloc, { width: colonne });
    doc.font("Helvetica").fontSize(9).fillColor(INK);
    doc.text(d.hote.nom, { width: colonne });
    doc.fillColor(MUTED);
    if (d.hote.email) doc.text(d.hote.email, { width: colonne });
    doc.text("Hôte Escale", { width: colonne });

    doc.y = Math.max(finGauche, doc.y);
    doc.moveDown(1.5);

    // Objet
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text("Objet", G);
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    doc.text(
      `Commission de mise en relation — réservation du ${fmtDate(
        d.reservation.debut
      )} au ${fmtDate(d.reservation.fin)}, ${d.reservation.logement}.`,
      { width: LARGEUR, align: "justify" }
    );
    doc.moveDown(1.2);

    // Tableau : ventilation HT / TVA / TTC
    const assiette = Math.max(0, d.reservation.montantTotal - d.reservation.taxeSejour);
    const tauxEffectif = assiette > 0 ? d.montants.ttc / assiette : 0;

    const colonnes = [
      { titre: "Désignation", largeur: LARGEUR - 3 * 92, align: "left" as const },
      { titre: "Base HT", largeur: 92, align: "right" as const },
      { titre: `TVA ${fmtTaux(d.montants.tauxTva, 0)}`, largeur: 92, align: "right" as const },
      { titre: "Total TTC", largeur: 92, align: "right" as const },
    ];

    let x = G;
    const yTete = doc.y;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
    for (const c of colonnes) {
      doc.text(c.titre, x, yTete, { width: c.largeur, align: c.align });
      x += c.largeur;
    }
    doc.moveDown(0.4);
    doc
      .moveTo(G, doc.y)
      .lineTo(G + LARGEUR, doc.y)
      .strokeColor(LIGNE)
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.5);

    const designation =
      `Commission Escale (${fmtTaux(tauxEffectif)} du montant du séjour)` +
      (d.reservation.taxeSejour > 0
        ? `\nAssiette : ${fmtEUR(assiette)} — taxe de séjour de ${fmtEUR(
            d.reservation.taxeSejour
          )} exclue`
        : "");

    const yLigne = doc.y;
    const valeurs = [designation, fmtEUR(d.montants.ht), fmtEUR(d.montants.tva), fmtEUR(d.montants.ttc)];
    x = G;
    doc.font("Helvetica").fontSize(9).fillColor(INK);
    let basLigne = yLigne;
    colonnes.forEach((c, i) => {
      doc.text(valeurs[i], x, yLigne, { width: c.largeur, align: c.align });
      basLigne = Math.max(basLigne, doc.y);
      x += c.largeur;
    });
    doc.y = basLigne;
    doc.moveDown(0.6);
    doc
      .moveTo(G, doc.y)
      .lineTo(G + LARGEUR, doc.y)
      .strokeColor(LIGNE)
      .stroke();
    doc.moveDown(0.6);

    // Totaux
    const largeurTotaux = 184;
    const xTotaux = G + LARGEUR - largeurTotaux;
    const ligneTotal = (libelle: string, valeur: string, gras = false) => {
      const y = doc.y;
      doc.font(gras ? "Helvetica-Bold" : "Helvetica").fontSize(gras ? 11 : 9);
      doc.fillColor(gras ? INK : MUTED).text(libelle, xTotaux, y, { width: 92 });
      doc
        .fillColor(INK)
        .text(valeur, xTotaux + 92, y, { width: 92, align: "right" });
      doc.moveDown(0.35);
    };

    ligneTotal("Total HT", fmtEUR(d.montants.ht));
    ligneTotal(`TVA ${fmtTaux(d.montants.tauxTva, 0)}`, fmtEUR(d.montants.tva));
    ligneTotal("Total TTC", fmtEUR(d.montants.ttc), true);

    doc.moveDown(1.5);
    doc.x = G;

    // Mentions
    doc.font("Helvetica").fontSize(8).fillColor(MUTED);
    doc.text(
      d.reverseLe
        ? `Facture acquittée. La commission a été retenue sur le reversement effectué le ${fmtDate(
            d.reverseLe
          )} ; elle ne donne lieu à aucun paiement séparé.`
        : "La commission est retenue sur le reversement du séjour et ne donne lieu à aucun paiement séparé.",
      { width: LARGEUR, align: "justify" }
    );
    doc.moveDown(0.4);

    // La rétrocommission conciergerie n'apparaît volontairement pas sur la
    // facture : elle est une répartition interne à Escale, postérieure à la
    // commission facturée, et ne modifie ni le montant dû par l'hôte ni la
    // base d'imposition. Le montant reste enregistré en base
    // (commission_invoices.partner_fee) pour la traçabilité comptable.

    doc.text(`Référence de réservation : ${d.reservation.id}`, { width: LARGEUR });

    doc.end();
  });
}
