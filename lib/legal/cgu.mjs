// Texte des CGU, en markdown, composé à partir des taux et des mentions
// légales en vigueur au moment de la publication.
//
// Ce module ne sert qu'à FABRIQUER une version : une fois publiée dans
// legal_documents, la version est figée et ne dépend plus de ce fichier. Un
// changement de grille tarifaire ou de mentions légales impose donc d'en
// publier une nouvelle — c'est le prix du versionnement, et ce qui rend une
// acceptation opposable.
//
// Utilisé par scripts/publier-cgu.mjs et, en secours, par app/cgu/page.jsx
// tant qu'aucune version n'est publiée.

const pct = (taux, decimales = 2) => {
  const brut = (taux * 100).toFixed(decimales);
  const net = brut.includes(".") ? brut.replace(/0+$/, "").replace(/\.$/, "") : brut;
  return `${net.replace(".", ",")} %`;
};
const eur = (montant) => `${String(montant).replace(".", ",")} €`;

export function construireCGU({ tarifs, societe, contacts, mediateur }) {
  const commission = pct(tarifs.COMMISSION_RATE_TTC);
  const commissionHT = pct(tarifs.COMMISSION_RATE_HT);
  const abonnement = eur(tarifs.SUBSCRIPTION_FEE_TTC);
  const abonnementHT = eur(tarifs.SUBSCRIPTION_FEE_HT);
  const tauxAbo = pct(tarifs.SUBSCRIPTION_RATE_TTC);
  const tauxAboHT = pct(tarifs.SUBSCRIPTION_RATE_HT);
  const retro = pct(tarifs.CONCIERGERIE_RETROCOMMISSION);
  const netPartenaire = pct(
    Math.round((tarifs.COMMISSION_RATE_TTC - tarifs.CONCIERGERIE_RETROCOMMISSION) * 10000) / 10000
  );
  const tva = pct(tarifs.VAT_RATE, 0);

  return `# Conditions générales

Les présentes conditions régissent l'utilisation de la plateforme Escale, qui met en relation des hôtes proposant un hébergement et des voyageurs souhaitant le réserver.

## 1. Éditeur de la plateforme

La plateforme Escale, accessible en ligne et sous forme d'application installable, est éditée par ${societe.denomination} (${societe.formeJuridique}), au capital de ${societe.capital}, dont le siège social est situé ${societe.siege}, immatriculée au ${societe.rcs} sous le numéro SIRET ${societe.siret}, numéro de TVA intracommunautaire ${societe.tva}.

Directeur de la publication : ${societe.directeurPublication}. Hébergement : ${societe.hebergeur}. Contact : ${contacts.general}.

## 2. Définitions

- **Plateforme** : le service en ligne Escale, ses interfaces web et mobile, et les services associés.
- **Hôte** : utilisateur qui publie une annonce et propose un hébergement à la location.
- **Voyageur** : utilisateur qui réserve un hébergement publié sur la plateforme.
- **Annonce** : la description, les photos, le tarif, les équipements et les règles d'un hébergement, définis par l'hôte.
- **Réservation** : le contrat de location conclu directement entre un hôte et un voyageur par l'intermédiaire de la plateforme.
- **Commission** : la rémunération d'Escale au titre de son service de mise en relation.

## 3. Rôle d'Escale : un intermédiaire, pas un loueur

Escale fournit un service de mise en relation et d'encaissement sécurisé. Escale n'est ni propriétaire, ni gestionnaire, ni locataire des hébergements publiés, et n'est pas partie au contrat de location conclu entre l'hôte et le voyageur.

Le contrat de location est formé exclusivement entre l'hôte et le voyageur. Les conditions particulières de chaque séjour — horaires d'arrivée et de départ, acceptation des animaux, ménage, politique d'annulation, montant de la caution — sont définies par l'hôte dans son annonce et prévalent sur toute description générale de la plateforme.

## 4. Inscription et compte utilisateur

L'inscription est réservée aux personnes physiques majeures et capables, et aux personnes morales dûment représentées. L'utilisateur garantit l'exactitude des informations communiquées et s'engage à les tenir à jour.

L'utilisateur est responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son compte. Certaines fonctionnalités (publication d'une annonce, réservation, versement) peuvent être subordonnées à la vérification de l'identité ou à la fourniture de justificatifs.

## 5. Obligations de l'hôte

- Publier une annonce sincère : photos, superficie, équipements, capacité et localisation doivent correspondre à la réalité du bien.
- Disposer du droit de louer le bien et respecter la réglementation applicable : autorisation de changement d'usage ou déclaration en mairie lorsqu'elle est requise, numéro d'enregistrement, règlement de copropriété, accord du bailleur en cas de sous-location.
- Déclarer les revenus perçus et s'acquitter des obligations fiscales et sociales correspondantes, ainsi que de la taxe de séjour lorsqu'elle est due.
- Souscrire les assurances adaptées à son activité de location et maintenir le logement conforme aux règles de sécurité et de salubrité.
- Tenir son calendrier à jour, y compris en cas de synchronisation avec une plateforme tierce, et honorer les réservations confirmées.

## 6. Obligations du voyageur

- Utiliser le logement en bon père de famille et respecter les règles fixées par l'hôte.
- Ne pas dépasser la capacité d'accueil annoncée ni sous-louer le logement.
- Signaler à l'hôte tout dommage ou dysfonctionnement dans les meilleurs délais.
- Restituer le logement dans l'état dans lequel il l'a trouvé, usure normale exceptée.

## 7. Réservation, prix et commission

Le prix affiché comprend le tarif fixé par l'hôte, les options éventuellement sélectionnées et la commission d'Escale. Le montant total est présenté au voyageur avant tout paiement : aucun frais supplémentaire n'est ajouté après confirmation. Aucun frais de service n'est facturé au voyageur, à quelque titre que ce soit.

Selon le réglage choisi par l'hôte, la réservation est confirmée immédiatement ou après validation de sa part. La confirmation vaut conclusion du contrat de location entre l'hôte et le voyageur.

La commission d'Escale est supportée par l'hôte et prélevée sur chaque réservation confirmée, selon la formule à laquelle il est rattaché :

- **Formule Commission** : ${commission} du montant du séjour.
- **Formule Abonnement** : ${abonnement} par mois, augmentés de ${tauxAbo} du montant du séjour.

La taxe de séjour, collectée pour le compte de la commune et intégralement reversée à l'hôte qui en est redevable, est exclue de l'assiette de la commission.

Lorsque l'hôte a été orienté vers la plateforme par une conciergerie partenaire, ${retro} du montant du séjour est reversé à ce partenaire à titre de rétrocommission commerciale, Escale conservant ${netPartenaire}. Cette répartition est interne à Escale : elle est sans incidence sur les sommes dues par le voyageur comme sur le montant reversé à l'hôte.

## 7 bis. Tarifs hôtes exprimés toutes taxes comprises

Escale est assujettie à la taxe sur la valeur ajoutée. Les taux et montants mentionnés à l'article 7 s'entendent **toutes taxes comprises**, au taux de TVA en vigueur de ${tva}. Aucun montant ne s'ajoute à ces taux au titre de la TVA.

À titre indicatif, les équivalents hors taxes sont de ${commissionHT} pour la formule Commission et de ${abonnementHT} par mois majorés de ${tauxAboHT} pour la formule Abonnement. En cas de modification du taux légal de TVA, les taux toutes taxes comprises sont ajustés à due concurrence, sans que cela constitue une modification des présentes conditions au sens de l'article 15.

## 8. Paiement séquestré et versement à l'hôte

Le paiement est encaissé au moment de la réservation par notre prestataire de services de paiement, puis conservé jusqu'à la fin du séjour. Les fonds sont versés à l'hôte le lendemain de la fin du séjour, sous réserve qu'aucun signalement ne soit en cours sur la réservation.

Lorsque l'hôte exige une caution, celle-ci fait l'objet d'une empreinte bancaire préautorisée avant l'arrivée. Elle est libérée après le séjour, ou débitée en tout ou partie en cas de dommage justifié, dans les limites du montant annoncé.

## 9. Annulation

Les conditions d'annulation applicables sont celles indiquées dans l'annonce et rappelées au voyageur avant le paiement. En cas d'annulation par l'hôte d'une réservation confirmée, le voyageur est intégralement remboursé des sommes versées.

S'agissant de prestations d'hébergement fournies à une date déterminée, le droit de rétractation de quatorze jours prévu par le Code de la consommation ne s'applique pas (art. L.221-28, 12°).

## 10. Signalements et médiation

L'hôte comme le voyageur peuvent signaler un problème avant le reversement des fonds. Le signalement suspend le versement le temps de l'instruction. L'équipe Escale examine les éléments transmis par les deux parties et décide de libérer les fonds, de rembourser tout ou partie du séjour au voyageur, ou de clore le signalement.

Cette procédure interne est un service de facilitation. Elle ne prive aucune partie de son droit d'agir en justice ni de saisir un médiateur.

## 11. Contenus publiés et avis

L'utilisateur reste titulaire des droits sur les contenus qu'il publie (textes, photos) et concède à Escale une licence gratuite et non exclusive pour les afficher et les promouvoir dans le cadre du service, pour la durée de leur publication.

Les avis ne peuvent être déposés que par un voyageur ayant effectivement séjourné dans le logement. Escale ne modifie pas les avis et n'en retire que ceux qui sont manifestement illicites, injurieux ou sans rapport avec le séjour.

## 12. Responsabilité

Escale est responsable du bon fonctionnement de son service de mise en relation et d'encaissement. Elle ne répond pas de la conformité du logement, du comportement des utilisateurs, ni de l'exécution du contrat de location, qui relèvent de l'hôte et du voyageur.

Escale met en œuvre les moyens raisonnables pour assurer la disponibilité de la plateforme, sans garantir une accessibilité ininterrompue, notamment en cas de maintenance ou de défaillance d'un prestataire tiers.

## 13. Suspension et résiliation

L'utilisateur peut fermer son compte à tout moment ; les réservations en cours restent dues et doivent être honorées. Escale peut suspendre ou fermer un compte en cas de manquement grave aux présentes conditions, de fraude, ou d'atteinte à la sécurité des autres utilisateurs, après information de l'intéressé sauf urgence ou obligation légale contraire.

## 14. Données personnelles

Le traitement des données personnelles est décrit dans notre politique de confidentialité, accessible à l'adresse /confidentialite. Toute question peut être adressée à ${contacts.donnees}.

## 15. Modification des conditions

Escale peut modifier les présentes conditions. Les utilisateurs sont informés des modifications substantielles avant leur entrée en vigueur. Les réservations déjà confirmées restent régies par les conditions en vigueur au jour de la réservation.

## 16. Droit applicable et règlement des litiges

Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité en écrivant à ${contacts.litiges}.

Conformément à l'article L.612-1 du Code de la consommation, tout consommateur peut recourir gratuitement au médiateur de la consommation : ${mediateur.nom} — ${mediateur.site}. La plateforme européenne de règlement en ligne des litiges est également accessible à l'adresse ec.europa.eu/consumers/odr.
`;
}
