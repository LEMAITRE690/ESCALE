# Phase démo Escale — plan de validation avant production

Base protégée : `main` (socle PR11).

## 1. Démo voyageur de bout en bout
- Recherche avancée
- Résultats et filtres
- Fiche logement
- Réservation simulée
- Confirmation
- Espace voyageur

## 2. Recherche et filtres
- Destination
- Dates
- Voyageurs
- Budget par nuit et budget total
- Type de logement
- Chambres / lits
- Équipements
- Animaux
- Réservation instantanée
- Prix Juste Escale
- Économies affichées
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

## 4. Démo conciergerie
- Multi-propriétaires
- Multi-logements
- Réservations
- Planning
- Rétrocommissions
- Accès partenaire / super-hôte

## 5. Cohérence UX
- Charte graphique PR11 comme référence
- Composants réutilisables
- États vides, chargement, erreur, succès
- Responsive
- Accessibilité
- Parcours cohérents entre voyageur, hôte et conciergerie

## 6. Gouvernance de validation
- Aucun merge automatique vers `main`
- Chaque lot reste en branche / PR dédiée
- Validation visuelle et fonctionnelle avant fusion
- La version stable reste disponible comme point de retour
