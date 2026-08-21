# Phase démo Escale — validation avant production

Base protégée : `main`, socle stable issu de la PR11.

## 1. Démo voyageur de bout en bout
- Recherche avancée
- Résultats et filtres
- Fiche logement
- Réservation simulée
- Confirmation
- Espace voyageur
- Données fictives uniquement

## 2. Recherche et filtres
- Destination et recherche naturelle
- Dates et flexibilité
- Voyageurs
- Budget par nuit et budget total
- Type de logement
- Chambres et lits
- Équipements
- Animaux
- Réservation instantanée
- Prix Juste Escale
- Ancien prix barré et économie affichée
- Filtres actifs visibles
- Carte synchronisée

## 3. Démo hôte
- Création d'annonce
- Tarification
- Charte Prix Juste
- Calendrier
- Réservation reçue
- Contrat
- Paiement simulé
- CRM voyageur
- États vides, erreur, succès et chargement

## 4. Démo conciergerie
- Multi-propriétaires
- Multi-logements
- Réservations
- Planning
- Rétrocommissions
- Accès partenaire / super-hôte
- Vue opérationnelle du jour

## 5. Cohérence UX
- Charte graphique PR11 comme référence
- Composants réutilisables
- Navigation cohérente entre espaces
- États vides, chargement, erreur et succès
- Responsive mobile / tablette / desktop
- Accessibilité clavier, contraste et libellés
- Même logique de boutons, cartes, badges et messages système

## 6. Gouvernance de validation
- Aucun merge automatique vers `main`
- Chaque lot reste en branche / PR dédiée
- Validation visuelle et fonctionnelle avant fusion
- La version stable reste disponible comme point de retour
- Les données de démonstration ne doivent jamais être confondues avec des données réelles

## Centre de démonstration
- `/demo` : hub pré-production
- `/demo-voyageur` : recherche et expérience voyageur
- `/demo/hote` : scénario hôte
- `/demo/conciergerie` : scénario conciergerie

## Critère de sortie
La phase démo est considérée validée quand un testeur peut parcourir les trois rôles principaux, comprendre immédiatement l’état de chaque écran, exécuter les actions clés sans assistance et revenir à un état stable sans modifier les données de production.
