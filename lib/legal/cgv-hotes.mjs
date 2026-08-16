// Texte des CGV Hôtes, en markdown, composé à partir des taux et des mentions
// légales en vigueur au moment de la publication.
//
// Comme pour les CGU : ce module fabrique une version, il ne la sert pas. Une
// fois publiée dans legal_documents, la version est figée et n'est plus liée à
// ce fichier. Un changement de grille tarifaire impose d'en publier une
// nouvelle, que les hôtes devront réaccepter.

const pct = (taux, decimales = 2) => {
  const brut = (taux * 100).toFixed(decimales);
  const net = brut.includes(".") ? brut.replace(/0+$/, "").replace(/\.$/, "") : brut;
  return `${net.replace(".", ",")} %`;
};
const eur = (montant) => `${String(montant).replace(".", ",")} €`;

export function construireCGVHotes({ tarifs, societe, dateEffet }) {
  const commission = pct(tarifs.COMMISSION_RATE_TTC);
  const abonnement = eur(tarifs.SUBSCRIPTION_FEE_TTC);
  const tauxAbo = pct(tarifs.SUBSCRIPTION_RATE_TTC);

  const dateLisible = dateEffet
    ? new Date(dateEffet).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "[date]";

  return `# Conditions Générales de Vente — Hôtes

Contrat d'accès et d'utilisation payante de la plateforme

**PROJET — À FAIRE VALIDER PAR UN AVOCAT AVANT PUBLICATION**

Les présentes conditions générales de vente (ci-après les « CGV ») sont conclues entre :

La société ${societe.denomination}, ${societe.formeJuridique}, immatriculée sous le numéro ${societe.siren}, dont le siège social est situé ${societe.siege} (ci-après « la Plateforme » ou « Escale »),

Et toute personne physique ou morale souhaitant publier une ou plusieurs annonces de logement sur la Plateforme (ci-après « l'Hôte »).

Toute inscription en tant qu'Hôte emporte acceptation sans réserve des présentes CGV, ainsi que des Conditions Générales d'Utilisation de la Plateforme, auxquelles les présentes CGV renvoient pour tout ce qui concerne le fonctionnement général du service, le rôle d'intermédiaire d'Escale et la résolution des litiges avec les voyageurs.

## Article 1 — Objet

Les présentes CGV ont pour objet de définir les conditions financières et contractuelles dans lesquelles Escale met sa plateforme à la disposition de l'Hôte, en contrepartie d'une rémunération, pour la publication d'annonces de logement, la mise en relation avec des voyageurs, l'encaissement séquestré des paiements et leur reversement, ainsi que l'accès aux outils de gestion locative (calendrier, messagerie, contrats, tableau de bord).

Escale agit en qualité d'intermédiaire technique et n'est pas partie au contrat de location conclu entre l'Hôte et le voyageur, dont les conditions générales font l'objet d'un document distinct.

## Article 2 — Formules tarifaires

L'Hôte choisit, lors de son inscription, l'une des deux formules suivantes, modifiable ultérieurement depuis son tableau de bord :

- **Formule Commission** : une commission de ${commission} toutes taxes comprises est prélevée sur chaque réservation confirmée et payée, sans frais fixe ni engagement de durée.
- **Formule Abonnement** : un abonnement mensuel de ${abonnement} toutes taxes comprises, prélevé automatiquement, auquel s'ajoute une commission réduite de ${tauxAbo} toutes taxes comprises par réservation confirmée et payée.

Les taux ci-dessus sont ceux en vigueur à la date des présentes. Toute évolution fait l'objet d'une information préalable de l'Hôte, dans un délai raisonnable avant son entrée en vigueur, par tout moyen approprié (notification sur la Plateforme, courrier électronique).

Un changement de formule demandé par l'Hôte depuis son tableau de bord prend effet au premier jour du mois suivant la demande. Il ne s'applique pas rétroactivement aux réservations déjà confirmées.

## Article 3 — Paiement, séquestre et facturation

Le paiement du voyageur est collecté par Escale au moment de la réservation et conservé de façon séquestrée jusqu'à la fin du séjour. Le montant dû à l'Hôte, déduction faite de la commission applicable, lui est reversé automatiquement à l'issue du séjour, par l'intermédiaire du prestataire de paiement de la Plateforme.

Pour la formule Abonnement, le prélèvement mensuel est effectué automatiquement à échéance. En cas d'échec de prélèvement non régularisé à l'expiration du délai accordé par le prestataire de paiement, l'Hôte est automatiquement replacé en formule Commission, sans interruption ni suspension de ses annonces déjà publiées.

Une facture est mise à disposition de l'Hôte pour chaque commission ou abonnement prélevé, comportant les mentions légales obligatoires, notamment l'identification complète d'Escale et, le cas échéant, la ventilation hors taxes et TVA applicable.

## Article 4 — Droit de rétractation

Lorsque l'Hôte est une personne physique agissant à des fins n'entrant pas dans le cadre de son activité professionnelle, il dispose d'un délai de quatorze (14) jours à compter de la souscription d'une formule pour exercer son droit de rétractation, conformément aux articles L. 221-18 et suivants du Code de la consommation.

L'Hôte qui souhaite que le service soit rendu disponible immédiatement, avant l'expiration de ce délai, en fait la demande expresse et reconnaît, ce faisant, qu'il perd son droit de rétractation dès lors que le service aura été pleinement exécuté avant la fin dudit délai, conformément à l'article L. 221-28 1° du Code de la consommation.

## Article 5 — Obligations de l'Hôte

- Fournir des informations exactes et à jour sur son identité, son logement et ses annonces ;
- Transmettre les documents justificatifs requis par la Plateforme aux fins de vérification et de lutte contre la fraude ;
- Respecter la réglementation applicable à la location de courte durée (déclaration en mairie, classement, taxe de séjour, assurance) ;
- Renseigner le taux de taxe de séjour applicable à sa commune et les conditions de séjour propres à chaque annonce (options, politique d'annulation, capacité d'accueil) ;
- Répondre aux demandes de la Plateforme dans le cadre du traitement d'un signalement ou d'un litige.

## Article 6 — Politique d'annulation et taxe de séjour

L'Hôte choisit, pour chacune de ses annonces, l'une des politiques d'annulation proposées par la Plateforme, dont les modalités de remboursement au voyageur sont détaillées dans les Conditions générales de location. La taxe de séjour, calculée sur le nombre de voyageurs majeurs déclarés lors de la réservation, est collectée par la Plateforme pour le compte des communes et n'entre pas dans l'assiette de la commission due à Escale.

## Article 7 — Responsabilité

La responsabilité d'Escale, en sa qualité d'intermédiaire technique, est limitée dans les conditions définies par les Conditions Générales d'Utilisation de la Plateforme, auxquelles il est renvoyé. Escale ne saurait être tenue responsable des manquements de l'Hôte à ses propres obligations légales, fiscales ou réglementaires.

## Article 8 — Durée et résiliation

Les présentes CGV s'appliquent pour toute la durée d'utilisation de la Plateforme par l'Hôte en cette qualité. L'Hôte peut à tout moment cesser d'utiliser la Plateforme, sous réserve du respect de ses obligations au titre des réservations déjà confirmées à la date de cessation.

Escale peut suspendre ou résilier l'accès de l'Hôte à la Plateforme en cas de manquement grave ou répété aux présentes CGV, aux Conditions Générales d'Utilisation, ou à la réglementation applicable, selon les modalités prévues par ces dernières.

## Article 9 — Réclamations et litiges

Toute réclamation relative à la facturation ou à l'exécution des présentes CGV peut être adressée au support de la Plateforme. Les modalités de médiation et de résolution des litiges sont précisées dans les Conditions Générales d'Utilisation.

## Article 10 — Droit applicable

Les présentes CGV sont soumises au droit français. En cas de litige et à défaut de résolution amiable, les tribunaux compétents sont ceux déterminés par les règles de droit commun applicables, sans préjudice des dispositions d'ordre public protectrices du consommateur lorsque l'Hôte a cette qualité.

Version en vigueur à compter du ${dateLisible}.
`;
}
