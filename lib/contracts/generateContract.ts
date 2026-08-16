import PDFDocument from "pdfkit";

// Les mêmes libellés que ceux utilisés côté formulaire de publication et
// détail logement — gardés cohérents avec le reste de l'application.
const POLITIQUES_ANNULATION: Record<string, { label: string; description: string }> = {
  flexible: { label: "Flexible", description: "Remboursement intégral jusqu'à 24h avant l'arrivée." },
  moderee: { label: "Modérée", description: "Remboursement intégral jusqu'à 5 jours avant l'arrivée." },
  stricte: { label: "Stricte", description: "Remboursement à 50% jusqu'à 14 jours avant l'arrivée, rien après." },
  tres_stricte: { label: "Très stricte", description: "Remboursement à 50% jusqu'à 30 jours avant l'arrivée, rien après." },
  non_remboursable: { label: "Non remboursable", description: "Aucun remboursement une fois la réservation confirmée, sauf annulation par l'hôte." },
};

const EQUIPEMENTS_LABELS: Record<string, string> = {
  wifi: "Wifi", parking: "Parking", cuisine: "Cuisine équipée", clim: "Climatisation", piscine: "Piscine",
  lave_vaisselle: "Lave-vaisselle", micro_ondes: "Micro-ondes", refrigerateur: "Réfrigérateur",
  cafetiere: "Cafetière", bouilloire: "Bouilloire", chauffage: "Chauffage", tv: "Télévision",
  lave_linge: "Lave-linge", seche_linge: "Sèche-linge", fer_a_repasser: "Fer à repasser",
  seche_cheveux: "Sèche-cheveux", serviettes_fournies: "Serviettes fournies", produits_toilette: "Produits de toilette",
  jardin: "Jardin", terrasse_balcon: "Terrasse ou balcon", barbecue: "Barbecue",
  detecteur_fumee: "Détecteur de fumée", detecteur_co: "Détecteur de monoxyde de carbone",
  extincteur: "Extincteur", trousse_secours: "Trousse de secours",
};

export type DonneesContrat = {
  reservationId: string;
  hoteNom: string;
  identiteHoteVerifiee: boolean;
  voyageurPrenom: string;
  identiteVoyageurVerifiee: boolean;
  logement: {
    titre: string;
    type: string | null;
    ville: string | null;
    adresse: string | null;
    description: string | null;
    guests: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    houseRules: string | null;
    checkinTime: string | null;
    checkoutTime: string | null;
    cancellationPolicy: string;
    securityDeposit: number | null; // en euros
    petsAllowed: boolean;
    petsFee: number | null;
    cleaningFee: number | null;
  };
  sejour: {
    startDate: string;
    endDate: string;
    guests: number;
    amountTotal: number; // en centimes
    withPet: boolean;
  };
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function fmtEUR(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// Génère le PDF en mémoire et le renvoie sous forme de Buffer — chaque
// contrat est entièrement recomposé à partir des données réelles de
// l'annonce et de la réservation concernées : deux logements différents
// produisent deux contrats aux clauses différentes (équipements, règlement,
// annulation, caution...), sans intervention manuelle de l'hôte.
export async function genererContratPDF(d: DonneesContrat): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const INK = "#1B3A3A";
    const MUTED = "#6B5B4D";
    const OCRE = "#C97B3D";

    function titre(texte: string) {
      doc.moveDown(1.2);
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text(texte);
      doc.moveDown(0.4);
      doc.fillColor("#1B1B1B").font("Helvetica").fontSize(10);
    }
    function paragraphe(texte: string) {
      doc.fillColor("#2A2A2A").font("Helvetica").fontSize(10).text(texte, { align: "justify", lineGap: 2 });
      doc.moveDown(0.5);
    }
    function ligneChamp(label: string, valeur: string) {
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(MUTED).text(label + " ", { continued: true });
      doc.font("Helvetica").fillColor("#1B1B1B").text(valeur);
    }

    // En-tête
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(18).text("Contrat de location saisonnière");
    doc.fillColor(OCRE).font("Helvetica").fontSize(9).text("Généré automatiquement via Escale — conditions particulières propres à ce logement et ce séjour.");
    doc.moveDown(0.3);
    doc.fillColor(MUTED).fontSize(8).text(`Réservation n° ${d.reservationId}`);

    titre("Article 1 — Parties");
    paragraphe(
      "Le présent contrat est conclu directement entre l'Hôte et le Voyageur ci-dessous identifiés, " +
      "Escale n'intervenant qu'en qualité d'intermédiaire technique de mise en relation et de paiement " +
      "(voir les Conditions Générales d'Utilisation d'Escale pour le détail de ce rôle)."
    );
    ligneChamp("Hôte :", d.hoteNom);
    if (d.identiteHoteVerifiee) {
      doc.fillColor("#1B6B4A").font("Helvetica-Bold").fontSize(8.5).text("✓ Identité de l'hôte vérifiée par Escale");
      doc.moveDown(0.2);
    }
    ligneChamp("Voyageur :", d.voyageurPrenom);
    if (d.identiteVoyageurVerifiee) {
      doc.fillColor("#1B6B4A").font("Helvetica-Bold").fontSize(8.5).text("✓ Identité du voyageur vérifiée par Escale");
      doc.moveDown(0.2);
    }
    doc.moveDown(0.3);
    paragraphe(
      "Le Voyageur s'engage à être titulaire, pendant toute la durée du séjour défini à l'Article 3, " +
      "d'une assurance en cours de validité couvrant sa responsabilité civile (assurance villégiature, " +
      "assurance habitation avec extension villégiature, ou garantie équivalente), de nature à couvrir " +
      "les dommages qu'il pourrait causer au logement, à ses équipements ou à des tiers pendant son séjour."
    );
    doc.fillColor("#7A2E1F").font("Helvetica-Oblique").fontSize(8.5).text(
      "⚠ Ce contrat ne comporte pas l'adresse complète ni de pièce d'identité des parties — " +
      "à compléter manuellement si une valeur juridique renforcée est requise."
    );

    titre("Article 2 — Description du logement");
    ligneChamp("Intitulé :", d.logement.titre);
    if (d.logement.type) ligneChamp("Type de logement :", d.logement.type);
    if (d.logement.ville) ligneChamp("Localisation :", d.logement.adresse ? `${d.logement.adresse}, ${d.logement.ville}` : d.logement.ville);
    ligneChamp("Capacité :", `${d.logement.guests} voyageur(s) — ${d.logement.bedrooms} chambre(s), ${d.logement.bathrooms} salle(s) de bain`);
    doc.moveDown(0.3);
    if (d.logement.description) paragraphe(d.logement.description);
    if (d.logement.amenities.length > 0) {
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(MUTED).text("Équipements mis à disposition :");
      doc.font("Helvetica").fontSize(9.5).fillColor("#1B1B1B").text(
        d.logement.amenities.map((id) => EQUIPEMENTS_LABELS[id] ?? id).join(", ")
      );
      doc.moveDown(0.4);
    }
    if (d.logement.checkinTime || d.logement.checkoutTime) {
      ligneChamp("Horaires :", `Arrivée à partir de ${d.logement.checkinTime ?? "—"}, départ avant ${d.logement.checkoutTime ?? "—"}`);
    }

    titre("Article 3 — Durée et prix du séjour");
    ligneChamp("Séjour :", `du ${fmtDate(d.sejour.startDate)} au ${fmtDate(d.sejour.endDate)}`);
    ligneChamp("Nombre de voyageurs :", String(d.sejour.guests));
    if (d.sejour.withPet && d.logement.petsAllowed) {
      ligneChamp("Animal de compagnie :", `Accepté${d.logement.petsFee ? ` (supplément inclus : ${fmtEUR(d.logement.petsFee)})` : ""}`);
    }
    if (d.logement.cleaningFee) ligneChamp("Frais de ménage inclus :", fmtEUR(d.logement.cleaningFee));
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(`Montant total du séjour : ${fmtEUR(d.sejour.amountTotal / 100)}`);
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(
      "Conformément aux Conditions Générales d'Utilisation d'Escale, ce montant est retenu par Escale " +
      "jusqu'au lendemain de la fin du séjour avant reversement à l'Hôte."
    );

    const politique = POLITIQUES_ANNULATION[d.logement.cancellationPolicy] ?? POLITIQUES_ANNULATION.moderee;
    titre("Article 4 — Conditions d'annulation");
    paragraphe(`Politique applicable à ce logement : ${politique.label}. ${politique.description}`);

    if (d.logement.securityDeposit) {
      titre("Article 5 — Dépôt de garantie");
      paragraphe(
        `Un dépôt de garantie de ${fmtEUR(d.logement.securityDeposit)} est associé à ce logement. ` +
        "Il ne fait l'objet d'aucun prélèvement à la réservation et n'est débité qu'en cas de dommage " +
        "constaté, dans les conditions prévues par les Conditions Générales d'Utilisation d'Escale."
      );
    }

    if (d.logement.houseRules) {
      titre("Article 6 — Règlement intérieur du logement");
      paragraphe(d.logement.houseRules);
    }

    titre("Article 7 — Cadre général");
    paragraphe(
      "Pour toute disposition non prévue au présent contrat (procédure de signalement et de médiation, " +
      "modalités de paiement, statut d'intermédiaire d'Escale), les parties se réfèrent aux Conditions " +
      "Générales d'Utilisation d'Escale, disponibles sur la plateforme et réputées connues des deux parties."
    );

    doc.moveDown(1.5);
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(
      `Document généré le ${fmtDate(new Date().toISOString())} — ce contrat ne constitue pas un conseil ` +
      "juridique et devrait être revu par un professionnel du droit avant tout usage à valeur probante renforcée."
    );

    doc.end();
  });
}
