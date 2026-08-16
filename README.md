# Escale

Application de location de logements entre particuliers — Next.js (App Router) + Supabase + Stripe Connect.

## Contenu de ce dépôt

```
app/
  page.jsx                    Page de présentation (landing page)
  recherche/page.jsx          Recherche & résultats de logements
  logement/[id]/page.jsx      Détail d'un logement + réservation
  hote/page.jsx               Espace hôte + back-office admin (tableau de bord,
                               formulaire de publication d'annonce en 7 étapes)
  offline/page.tsx            Page affichée hors-ligne (PWA)
  api/
    listings/                 Création d'annonce (upload photos Supabase Storage)
    host/default-options/     Préférences par défaut de l'hôte
    ical/export/[listingId]/  Export du calendrier Escale vers Airbnb
    cron/sync-ical/           Import horaire des calendriers Airbnb (anti double-réservation)
    cron/release-payments/    Reversement quotidien des fonds aux hôtes après séjour
    stripe/checkout/          Création du paiement voyageur
    stripe/connect/onboard/   Onboarding Stripe Connect Express de l'hôte
    stripe/webhook/           Suivi des paiements et de l'onboarding
    admin/disputes/           Résolution des litiges (libérer / rembourser / clore)

components/
  settings/SyncCalendarAirbnb.jsx    Bloc de synchro Airbnb (composant autonome)
  settings/SetupPaiementsHote.jsx    Bloc d'onboarding paiement (composant autonome)
  InstallPrompt.jsx                  Bannière d'installation PWA

lib/
  stripe/client.ts    Client Stripe + calcul de la commission plateforme
  ical/generate.ts    Génération du fichier .ics exporté par Escale
  ical/parse.ts       Lecture du fichier .ics importé (Airbnb...)

supabase/migrations/  Schéma de base de données, à exécuter dans l'ordre numérique
docs/CGU_Escale.pdf   Conditions générales d'utilisation (à faire valider par un avocat)
```

## Mise en route

### 1. Dépendances

```bash
npm install
```

### 2. Variables d'environnement

Copiez `.env.example` en `.env.local` et renseignez :
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — dashboard Supabase > Project Settings > API (la clé anonyme, publique, utilisée côté navigateur)
- `SUPABASE_SERVICE_ROLE_KEY` — même page (clé secrète, jamais exposée au client)
- `STRIPE_SECRET_KEY` — dashboard Stripe > Developers > API keys
- `STRIPE_WEBHOOK_SECRET` — généré à l'étape 5
- `CRON_SECRET` — une chaîne aléatoire de votre choix (ex: `openssl rand -hex 32`)

### 3. Base de données Supabase

Exécutez les migrations dans l'ordre, via le SQL Editor du dashboard Supabase ou `supabase db push` :

```
supabase/migrations/0007_auth_profiles.sql
supabase/migrations/0008_listings_reservations.sql
supabase/migrations/0009_ical_sync.sql
supabase/migrations/0010_stripe_connect.sql
supabase/migrations/0011_defauts_hote.sql
supabase/migrations/0012_review_replies.sql
supabase/migrations/0013_equipment_reports.sql
supabase/migrations/0014_dommages_reconnus.sql
supabase/migrations/0015_cautions_gerees_par_escale.sql
supabase/migrations/0016_co_hotes.sql
supabase/migrations/0017_partenaires_conciergeries.sql
supabase/migrations/0018_super_hote_conciergerie.sql
supabase/migrations/0019_vue_commissions_partenaires.sql
supabase/migrations/0020_horaires_reglement_manquants.sql
supabase/migrations/0021_documents_hote_verification.sql
supabase/migrations/0022_documents_voyageur_verification.sql
supabase/migrations/0023_assurance_villegiature_voyageur.sql
supabase/migrations/0024_messagerie_filtrage_coordonnees.sql
supabase/migrations/0025_taxe_de_sejour.sql
supabase/migrations/0026_reversement_taxe_sejour.sql
```

⚠️ Toutes les tables référencées par une clé étrangère sont créées par une migration
antérieure dans cet ordre numérique — `0007_auth_profiles.sql` crée `profiles` (nécessaire
à `listings.host_id`), `0008_listings_reservations.sql` crée `listings`/`reservations`/`reviews`
(nécessaires aux migrations suivantes). Respectez cet ordre, ou utilisez `supabase db push`
qui l'applique automatiquement.

Créez également un bucket de stockage public nommé `listing-photos` (Storage > New bucket).

**Premier compte admin** : aucune inscription ne peut créer un compte admin (bloqué
volontairement par la migration 0007). Pour le tout premier compte admin, mettez à jour la
ligne manuellement dans le SQL Editor : `update profiles set role = 'admin' where email = '...'`.


### 4. Développement local

```bash
npm run dev
```

### 5. Déploiement (Vercel)

1. Poussez ce dépôt sur GitHub/GitLab et importez-le dans Vercel.
2. Renseignez les mêmes variables d'environnement dans Project Settings > Environment Variables.
3. Déployez.
4. Dans le dashboard Stripe (Developers > Webhooks), ajoutez un endpoint vers
   `https://votre-domaine.vercel.app/api/stripe/webhook`, événements :
   `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`.
   Copiez le secret de signature généré dans `STRIPE_WEBHOOK_SECRET`.
5. Vérifiez dans l'onglet "Cron Jobs" du dashboard Vercel que `sync-ical` et
   `release-payments` sont bien programmés (définis dans `vercel.json`).

## Ce qu'il reste à faire

Ce dépôt assemble tous les écrans et routes construits, mais certains points ne sont
**pas encore branchés** et nécessitent du développement complémentaire :

- **Landing page** — utilise encore des données de démonstration codées en dur
  (aperçu de logements, chiffres, témoignages) ; à remplacer par de vraies requêtes si besoin.
- **CGU** — à faire relire par un avocat avant publication, notamment les clauses sur le
  séquestre des paiements et les politiques d'annulation strictes.

L'authentification, le catalogue de logements, le parcours de réservation/paiement
(recherche → détail → réservation → Stripe Checkout → **confirmation**), les avis voyageurs,
le programme co-hôtes, le programme partenaires conciergeries, l'enregistrement réel des
photos (à la publication comme sur une annonce déjà existante), et **l'intégralité du
tableau de bord hôte** (Mes annonces, calendrier, réservations, revenus — y compris le
graphique des 6 derniers mois, agrégé depuis les vrais paiements — avis, signalements,
co-hôtes, conciergerie, documents) sont en revanche déjà branchés — voir les sections
suivantes.

## Confirmation post-paiement

- `/reservations/[id]` — page vers laquelle Stripe redirige après paiement (`success_url` /
  `cancel_url` de `/api/stripe/checkout`). Vérifie que le voyageur consultant la page est bien
  l'auteur de la réservation (jamais d'exposition croisée entre comptes), puis affiche un état
  différent selon le résultat : payé, annulé, ou en cours de traitement (le webhook Stripe peut
  arriver après la redirection du navigateur).

## Gestion des photos d'une annonce existante

- `POST /api/listings/:id/photos` — remplace les photos d'une annonce déjà publiée
  (distincte de `POST /api/listings`, qui crée une nouvelle annonce). Réservée à l'hôte
  propriétaire de l'annonce ; accepte à la fois de nouveaux fichiers et la liste des URLs déjà
  en ligne à conserver, pour permettre de réordonner/supprimer sans tout re-téléverser.
- Le bouton "Enregistrer les photos" de l'écran "Gérer les photos" (dans "Mes annonces")
  appelle réellement cette route.

## Authentification

- `/inscription` et `/connexion` — formulaires email/mot de passe (Supabase Auth).
- `middleware.ts` — redirige vers `/connexion` toute tentative d'accès à `/hote` sans session active.
- `app/hote/page.jsx` — re-vérifie la session côté serveur (filet de sécurité en plus du
  middleware) et transmet le rôle de l'utilisateur au tableau de bord.
- Rôles : `voyageur` (par défaut à l'inscription), `hote`, `admin`. Le bouton
  "Back-office admin" n'apparaît que pour le rôle `admin` — un utilisateur ne peut jamais
  se l'auto-attribuer (bloqué par un trigger SQL, voir migration 0007).
- Déconnexion : bouton dans l'espace hôte, appelle `POST /api/auth/signout`.
- `/mot-de-passe-oublie` — le lien "Oublié ?" de `/connexion` pointait vers cette page sans
  qu'elle n'ait jamais été créée ; corrigé. Envoie un e-mail de réinitialisation via
  `supabase.auth.resetPasswordForEmail`, avec un message de confirmation identique que
  l'adresse existe ou non (n'expose jamais si un e-mail est associé à un compte Escale).
- `/reinitialiser-mot-de-passe` — page d'arrivée du lien reçu par e-mail, où l'utilisateur
  choisit son nouveau mot de passe (`supabase.auth.updateUser`). Attend que Supabase restaure
  la session temporaire de réinitialisation avant d'activer le formulaire, pour éviter une
  soumission prématurée sans session valide.

## Catalogue de logements

- `supabase/migrations/0008_listings_reservations.sql` — crée les tables `listings`,
  `reservations` et `reviews` (avec `average_rating`/`review_count` maintenus
  automatiquement par trigger à chaque nouvel avis).
- `/recherche` — charge les annonces au statut `actif` depuis Supabase au chargement de la
  page, puis filtre/trie côté client (pas de rechargement réseau à chaque changement de filtre).
- `/logement/[id]` — page serveur : charge l'annonce et ses avis par identifiant, `notFound()`
  si l'annonce n'existe pas ou n'est pas active, puis transmet les données au composant
  client `DetailLogementClient` (galerie, résumé de réservation interactifs).

## Parcours de réservation

1. Le voyageur choisit ses dates sur `/logement/[id]` et clique sur "Réserver".
2. `POST /api/reservations` — crée la réservation en base avec le statut `en_attente`. Le
   montant n'est **jamais** pris tel quel depuis le navigateur : il est recalculé côté
   serveur à partir du prix, des frais de ménage/animaux et du nombre de nuits, avec
   vérification de la capacité, du séjour minimum/maximum et de l'absence de chevauchement
   avec une autre réservation.
3. `POST /api/stripe/checkout` — crée le paiement Stripe pour cette réservation et renvoie
   l'URL de la page de paiement hébergée.
4. Le voyageur est redirigé vers Stripe, puis vers `success_url` après paiement (à créer —
   voir "Ce qu'il reste à faire").
5. Le webhook Stripe (`/api/stripe/webhook`) confirme la réservation et enregistre le
   paiement ; les fonds restent retenus jusqu'à la fin du séjour (voir Article 10 des CGU).

Si le voyageur n'est pas connecté au moment de réserver, il est redirigé vers `/connexion`
avec un paramètre `suite` qui le ramène sur l'annonce après connexion.

## Avis voyageurs

- `/reservations` — page du voyageur listant ses réservations ; un bouton "Laisser un avis"
  apparaît sur chaque séjour terminé sans avis existant.
- `POST /api/reviews` — vérifie que la réservation appartient bien à l'appelant, que le
  séjour est terminé, et qu'aucun avis n'existe déjà pour cette réservation avant d'insérer
  la note et le commentaire. `average_rating`/`review_count` sur `listings` se mettent à
  jour automatiquement (trigger, migration 0008).
- `PATCH /api/reviews/:id/reply` — permet à l'hôte du logement concerné de répondre
  publiquement à un avis. La migration 0012 empêche, via un trigger, que cette route serve
  à modifier la note ou le commentaire du voyageur.
- La réponse de l'hôte, une fois publiée, est visible par tous sur `/logement/[id]`, sous
  l'avis correspondant.

## Signalement d'équipement pendant le séjour

- `components/SignalerEquipement.jsx` — affiché sur `/reservations` pour tout séjour
  commencé (en cours ou terminé). Le voyageur précise l'équipement concerné et une
  description ; pas besoin d'attendre la fin du séjour, contrairement à l'avis.
- `POST /api/equipment-reports` — vérifie que la réservation appartient au voyageur et que
  le séjour a bien commencé avant d'enregistrer le signalement.
- `PATCH /api/equipment-reports/:id` — réservée à l'hôte du logement concerné, pour faire
  évoluer le statut (`nouveau` → `en_cours` → `resolu`) et ajouter une note.
- Distinct de l'état des lieux : un signalement peut être fait à tout moment du séjour, pas
  seulement à l'entrée ou à la sortie — utile pour que l'hôte puisse réagir pendant que le
  voyageur est encore sur place plutôt que de le découvrir après coup.
- Le voyageur peut aussi **déclarer spontanément un dommage dont il est responsable** (pas
  seulement signaler une panne indépendante de sa volonté) : `fault_acknowledged` (migration
  0014) distingue les deux cas. Ce champ n'a aucun effet automatique sur le dépôt de
  garantie ou le paiement — il informe seulement l'hôte, qui reste seul décisionnaire via la
  procédure de médiation existante si une retenue sur caution est envisagée.

## Co-hôtes

- `supabase/migrations/0016_co_hotes.sql` — crée la table `co_hosts` et 3 niveaux d'accès
  prédéfinis (modifiables ensuite permission par permission) :
  - **Gestion complète** — modifie l'annonce, gère calendrier/réservations/messages, voit les revenus.
  - **Opérationnel** — gère calendrier/réservations/messages ; ne modifie pas l'annonce, ne voit pas les revenus.
  - **Messagerie seule** — répond aux voyageurs uniquement.
- `POST /api/co-hosts` — invite un co-hôte par e-mail sur une annonce précise (réservé à
  l'hôte principal). Si un compte existe déjà pour cet e-mail, l'accès est actif
  immédiatement ; sinon il reste en attente jusqu'à l'inscription (réconciliation par e-mail
  non implémentée dans cette version — voir le `TODO` dans la route).
- `PATCH /api/co-hosts/:id` — change le niveau global ou ajuste une permission précise.
- `DELETE /api/co-hosts/:id` — révocation douce (`status = 'revoque'`, la ligne est conservée
  pour traçabilité, jamais supprimée).
- Écran "Co-hôtes" accessible depuis "Mes annonces" dans l'espace hôte.

⚠️ **Un co-hôte n'a jamais accès aux virements ni aux coordonnées bancaires de l'hôte
principal**, quel que soit son niveau — `can_view_finances` ne conditionne qu'un affichage en
lecture dans le tableau de bord, jamais une action sur les routes Stripe. Les policies RLS
ajoutées par la migration 0016 sont additives : elles complètent les policies existantes
réservées à l'hôte principal, elles ne les remplacent pas.

## Partenaires conciergeries (rétrocommission)

- `supabase/migrations/0017_partenaires_conciergeries.sql` — crée la table `partners`
  (conciergeries), ajoute `profiles.referred_by_partner_id` et les colonnes de traçabilité
  correspondantes sur `payments`.
- **Tous les taux sont définis dans `lib/pricing.json`**, exposés typés par `lib/pricing.ts`
  et consommés partout ailleurs — code de paiement, page d'accueil, CGU en ligne et
  générateur du PDF des CGU. Aucun taux ne doit être réécrit en dur.
- La formule "Commission" est fixée à **8,5 % TTC** du montant du séjour, taxe de séjour
  exclue de l'assiette. La formule "Abonnement" (19 €/mois TTC + 5 % TTC) reste pour
  l'instant une maquette marketing non branchée dans le code de paiement : tous les hôtes
  relèvent de la formule Commission.
- Si l'hôte a été apporté par un partenaire, `computeFees()` retire 1 point au profit du
  partenaire (Escale conserve alors 7,5 %) — **le montant reversé à l'hôte ne change
  jamais**, avec ou sans partenaire.
- Les commentaires des migrations `0017` mentionnent encore l'ancienne grille à 6 % : ces
  fichiers ont déjà été appliqués en base et n'ont volontairement pas été réécrits.
- `POST /api/partners` — crée un partenaire et génère son code de parrainage (réservé aux
  administrateurs ; ce n'est pas une inscription libre).
- `POST /api/partners/onboard` — onboarding Stripe Connect du partenaire, sur le même
  principe que l'onboarding hôte.
- `POST /api/partners/attach` — un hôte renseigne le code de parrainage une seule fois
  (aucune réattribution possible ensuite, pour éviter tout détournement rétroactif de
  rétrocommission).
- Le webhook Stripe et le cron `release-payments` calculent et transfèrent automatiquement
  la part du partenaire, en parallèle du virement à l'hôte — jamais bloquant l'un pour l'autre.
- CGU (Article 12, nouveau) — précise que ce rattachement n'affecte jamais les sommes dues
  par le voyageur ni reversées à l'hôte, et ne fait pas du partenaire une partie au contrat
  de location.

## Contrat de location individualisé

- `lib/contracts/generateContract.ts` — génère un PDF de contrat de location entièrement
  recomposé à partir des données réelles de l'annonce et de la réservation concernées
  (équipements, règlement intérieur, horaires, politique d'annulation, caution...). Deux
  logements différents produisent deux contrats aux clauses différentes, sans aucune saisie
  manuelle de l'hôte.
- `GET /api/reservations/:id/contract` — génère le PDF à la volée pour une réservation
  confirmée ou terminée, accessible au voyageur ou à l'hôte concernés uniquement.
- Un lien "Voir le contrat de location" apparaît sur `/reservations` pour toute réservation
  confirmée ou terminée.
- `supabase/migrations/0020_horaires_reglement_manquants.sql` — corrige un oubli découvert à
  cette occasion : les horaires standards, le règlement intérieur et les équipements hors
  liste fermée étaient déjà collectés par le formulaire de publication et envoyés par
  `POST /api/listings`, mais la table `listings` n'avait jamais les colonnes correspondantes
  (`checkin_time`, `checkout_time`, `house_rules`, `extra_amenities`) — ces valeurs étaient
  donc silencieusement perdues avant cette migration.

⚠️ **Limite à connaître** : ce contrat ne comporte ni l'adresse complète ni de pièce
d'identité des parties (non collectées par le schéma actuel) — il couvre les conditions
particulières du séjour (description du bien, durée, prix, annulation, règlement, caution),
mais devrait être complété et revu par un professionnel du droit avant tout usage à valeur
probante renforcée.

✅ **Corrigé** : la fonction `publier()` du formulaire de publication (dans
`HoteDashboard.jsx`) appelle désormais réellement `POST /api/listings` — c'était le point le
plus bloquant du dépôt (le formulaire ne publiait jamais rien en base malgré une interface
entièrement fonctionnelle). Un vrai problème de sécurité a été corrigé au passage : la route
faisait confiance à un `hostId` envoyé par le formulaire client, permettant en théorie à
n'importe qui de publier une annonce au nom d'un autre utilisateur — l'hôte est désormais
systématiquement déterminé par la session authentifiée côté serveur, jamais par une valeur
transmise par le client. Reste, avec le graphique des 6 derniers mois, l'un des chantiers de
câblage restants.

## Documents requis (anti-fraude, alimente le contrat)

- `supabase/migrations/0021_documents_hote_verification.sql` — table `host_documents` (4
  types : pièce d'identité, justificatif de domicile, titre de propriété ou mandat de
  gestion, attestation d'assurance) et vue `host_verification_status`, qui calcule à la volée
  si l'identité de l'hôte est vérifiée sans jamais exposer le contenu des documents.
- **Bucket de stockage** : contrairement à `listing-photos` (public), les documents
  justificatifs doivent être stockés dans un bucket **privé** nommé `host-documents`
  (Storage > New bucket, laisser "Public" décoché) — à créer manuellement, une migration SQL
  ne peut pas créer de bucket.

## Formulaire de publication : tarif vs options vs règles

Le formulaire de publication distingue désormais explicitement trois concepts qui étaient
mélangés dans une même étape auparavant :

- **Tarif & équipements** (étape 4) — prix de base et équipements fixes du logement,
  s'appliquent automatiquement à toute réservation, aucun choix du voyageur.
- **Options du séjour** (étape 5, nouvelle) — suppléments que le **voyageur** active ou non à
  la réservation : animaux, frais de ménage, départ tardif, arrivée anticipée. Ce sont les
  mêmes champs qu'avant (`animauxAcceptes`, `menagePayant`, `departTardif`,
  `arriveeAnticipee`, et leurs suppléments respectifs), simplement regroupés dans une étape à
  part pour que la distinction soit claire dès la conception de l'annonce.
- **Règles du séjour** (étape 6) — politiques définies par l'**hôte**, non tarifaires :
  séjour min/max, réservation instantanée, enfants bienvenus, fumeurs, événements, politique
  d'annulation, caution, règlement intérieur.

Aucun champ n'a été renommé ni retiré : c'est une réorganisation de l'interface, la route
`POST /api/listings` n'a pas besoin d'être modifiée.
- `POST /api/host/documents` — l'hôte téléverse un document (10 Mo maximum) ; statut
  `en_attente` jusqu'à vérification.
- `GET /api/admin/documents/:id` — génère une URL signée temporaire (5 minutes) pour qu'un
  administrateur consulte un document, jamais de lien permanent vers un document sensible.
- `PATCH /api/admin/documents/:id` — valide ou refuse un document, réservé aux
  administrateurs.
- Sur l'espace hôte, le bloc "Documents requis" affiche les 4 documents avec leur statut
  (À fournir / En vérification / Validé / Refusé) et un bouton de téléversement direct.
- Une fois l'identité vérifiée (pièce d'identité + justificatif de domicile validés), le
  contrat de location généré (voir section précédente) affiche désormais un badge
  "✓ Identité de l'hôte vérifiée par Escale" — sans jamais exposer le contenu des documents
  eux-mêmes dans le contrat.

## Documents requis — espace voyageur

Symétrique côté voyageur, mais volontairement plus restreint qu'au niveau hôte : un
voyageur ne gère ni bien ni paiement de tiers, seule son identité importe.

- `supabase/migrations/0022_documents_voyageur_verification.sql` — table `guest_documents`
  (un seul type : pièce d'identité) et vue `guest_verification_status`, même principe que
  côté hôte.
- **Bucket de stockage** : `guest-documents`, également **privé**, distinct de
  `host-documents` — à créer manuellement (Storage > New bucket, "Public" décoché).
- `POST /api/guest/documents` — le voyageur téléverse sa pièce d'identité (10 Mo maximum).
- `GET /api/admin/guest-documents/:id` / `PATCH /api/admin/guest-documents/:id` — même
  principe que côté hôte (URL signée 5 minutes, validation/refus réservés aux administrateurs).
- `components/MesDocumentsVoyageur.jsx` — affiché en haut de `/reservations`, avec le
  statut de la pièce d'identité et un bouton de téléversement.

## Panneau admin — vérification des documents

Le back-office admin (`/hote`, rôle `admin`, onglet "Back-office admin") affiche désormais un
bloc **"Documents à vérifier"**, regroupant hôtes et voyageurs dans un même écran :

- `GET /api/admin/documents` / `GET /api/admin/guest-documents` — listent les documents en
  attente (`?status=tous` pour tout voir, y compris déjà traités).
- Chaque ligne propose **Consulter** (ouvre l'URL signée temporaire dans un nouvel onglet),
  **Valider**, ou **Refuser** (avec un motif obligatoire, transmis à l'utilisateur).
- Réutilise directement les routes `PATCH /api/admin/documents/:id` et
  `PATCH /api/admin/guest-documents/:id` déjà codées — aucune nouvelle route de décision,
  seulement l'interface qui manquait pour les actionner.

## Messagerie et prévention du contournement de la plateforme

La "Messagerie voyageurs" visible dans le tableau de bord hôte était jusqu'ici **entièrement
fictive** (aucune table, aucune route) — cette section la rend réelle, avec un filtrage
automatique destiné à limiter les réservations organisées en direct hors d'Escale (perte de
commission pour la plateforme, perte de la protection du paiement séquestré et de la
médiation pour les deux parties).

- `lib/messaging/filtrerCoordonnees.ts` — détecte et masque les numéros de téléphone
  français, les e-mails et les liens externes (dont les liens WhatsApp/Telegram) dans un
  message. Limite assumée et documentée : un filtrage par expression régulière n'arrête pas
  une évasion volontaire et travaillée (numéro épelé en toutes lettres, capture d'écran...) —
  c'est un frein, pas une garantie absolue.
- `supabase/migrations/0024_messagerie_filtrage_coordonnees.sql` — tables `conversations`
  et `messages`. Le contenu original (non filtré) est conservé séparément
  (`content_original`), accessible uniquement via une route service_role, pour permettre à un
  administrateur d'instruire un signalement en cas de contournement répété.
- `POST /api/messages` — **seul chemin d'écriture possible** (aucune policy `INSERT` client
  sur `messages`) : garantit que le filtrage est systématiquement appliqué avant toute
  écriture, jamais contournable en insérant directement depuis le client.
- CGU (Article 13, nouveau) — interdit explicitement l'échange de coordonnées dans le but de
  contourner la plateforme, mentionne le filtrage automatique (en précisant qu'il s'agit d'une
  mesure de prévention, pas d'une garantie), et prévoit la suspension du compte en cas de
  contournement avéré.

✅ **Interfaces de discussion construites, des deux côtés** :
- Voyageur — `components/FilDiscussion.jsx`, affiché sur chaque réservation non annulée
  dans `/reservations` (bouton "Discuter avec l'hôte").
- Hôte — fil de discussion intégré directement au tableau des réservations
  (`components/HoteDashboard.jsx`), une nouvelle colonne "Message" ouvre le fil sous la ligne
  correspondante. L'ancien composant `Messagerie` (générique, entièrement fictif) a été
  retiré plutôt que laissé à côté du vrai système, pour éviter toute confusion entre les deux.
- Les deux s'appuient sur le même identifiant `currentUserId` renvoyé par
  `GET /api/messages`, pour aligner les bulles (moi / l'autre partie) sans dépendance
  supplémentaire côté client.
- Le contrat de location affiche désormais aussi un badge "✓ Identité du voyageur vérifiée
  par Escale" quand applicable, symétrique à celui de l'hôte.
- `supabase/migrations/0023_assurance_villegiature_voyageur.sql` — ajoute un second document
  facultatif : l'attestation d'assurance villégiature (responsabilité civile), recommandée
  mais **jamais bloquante** — son absence n'empêche ni la réservation ni la génération du
  contrat. Affichée avec un badge "Facultatif" distinct plutôt que "À fournir" tant qu'elle
  n'est pas envoyée, pour ne pas donner une fausse impression d'obligation. Volontairement
  exclue du calcul de `identite_verifiee` (qui ne porte que sur la pièce d'identité) : fournir
  une assurance ne doit jamais se substituer à la vérification d'identité elle-même.
- Indépendamment de ce document facultatif, le **contrat de location généré** (voir section
  "Contrat de location individualisé") comporte désormais une clause d'engagement : le
  voyageur s'y engage contractuellement à être couvert par une assurance en cours de
  validité (responsabilité civile) pendant toute la durée du séjour — que le document ait
  été téléversé ou non. C'est une déclaration contractuelle du voyageur, distincte de la
  preuve documentaire elle-même.
- **Statut super-hôte** (migration 0018) — une conciergerie gère en général tout le
  portefeuille d'un hôte, pas une annonce isolée : le rattachement via code de parrainage
  lui accorde donc automatiquement un accès de gestion sur **l'ensemble** des annonces de cet
  hôte (`partner_host_grants`), plutôt que de devoir l'inviter annonce par annonce comme un
  co-hôte classique.
  - **La propriété de l'annonce (`listings.host_id`) ne change jamais** — ni à l'octroi de
    ce statut, ni à sa révocation. Un trigger SQL (`prevent_listing_ownership_transfer`)
    empêche techniquement toute session utilisateur, y compris celle de la conciergerie
    elle-même, de modifier le propriétaire d'une annonce.
  - `DELETE /api/partners/grants` — l'hôte révoque l'accès à tout moment, en un geste,
    indépendamment du rattachement financier. L'hôte conserve alors l'intégralité de ses
    annonces, telles quelles, avec ou sans conciergerie.

## Automatisation des commissions par super-hôte

- La rétrocommission suit désormais le **statut super-hôte actif au moment du paiement**
  (`partner_host_grants.status = 'actif'`), et non plus un simple tag statique sur le
  profil de l'hôte : si l'hôte révoque l'accès de sa conciergerie, la rétrocommission
  s'arrête automatiquement dès la réservation suivante, sans aucune intervention manuelle.
- `supabase/migrations/0019_vue_commissions_partenaires.sql` — vue SQL
  `partner_commission_summary`, recalculée à la volée à chaque lecture (jamais de
  maintenance manuelle) : nombre de réservations, total gagné, total déjà versé, total en
  attente de versement, par conciergerie.
- `GET /api/partners/:id/commissions` — expose ce résumé ainsi que le détail des 50 derniers
  paiements, accessible par la conciergerie elle-même (via son compte de connexion,
  `partners.owner_user_id`) ou par un administrateur.

## Espace conciergerie

- `/partenaire` — tableau de bord réel (données Supabase, pas un prototype avec des
  exemples) pour toute conciergerie dont `owner_user_id` correspond à l'utilisateur connecté :
  hôtes gérés (via `partner_host_grants`), leurs annonces, résumé des commissions
  (`partner_commission_summary`), et détail des versements récents.
- Le code de parrainage à partager aux hôtes est affiché avec un bouton de copie rapide.
- Un rappel de configuration Stripe Connect s'affiche tant que la conciergerie n'a pas
  terminé son onboarding — sans compte de paiement configuré, ses rétrocommissions
  s'accumulent mais ne peuvent pas encore lui être reversées.
- Aucune inscription libre pour devenir partenaire : la création d'un compte conciergerie
  reste une démarche administrative (`POST /api/partners`, réservée aux admins) — `/partenaire`
  affiche un message clair si le compte connecté n'est associé à aucune conciergerie.

## Recherche par intelligence artificielle

- `lib/anthropic/client.ts` — appelle Claude (`claude-haiku-4-5`, rapide et économique pour
  ce type d'extraction) avec un outil structuré (`tool_use`) pour transformer une phrase
  libre du voyageur ("un loft avec piscine pour 4 personnes, budget 150€") en filtres
  exploitables : ville, budget min/max, nombre de voyageurs, type de logement, équipements,
  animaux — plus une courte reformulation affichée au voyageur pour confirmer ce qui a été
  compris.
- `POST /api/search/ai` — reçoit la phrase, la fait interpréter, puis exécute une requête
  Supabase **classique** avec les filtres obtenus. Le modèle ne touche jamais directement la
  base de données : il ne fait qu'extraire une intention, la recherche elle-même reste
  entièrement structurée et déterministe.
- Sur `/recherche`, un bandeau dédié (fond encre, distinct de la barre de recherche
  classique juste en dessous) permet de basculer entre les deux modes — la recherche IA
  n'est jamais imposée, seulement proposée.
- Nécessite la variable d'environnement `ANTHROPIC_API_KEY` (voir `.env.example`).

⚠️ Ce dépôt fournit le mécanisme technique mais **pas d'interface dédiée aux conciergeries**
elles-mêmes (tableau de bord partenaire, suivi de leurs filleuls, etc.) — seulement un encart
côté hôte pour renseigner le code, et des routes serveur pour la gestion administrative.

## Taxe de séjour

- `supabase/migrations/0025_taxe_de_sejour.sql` — ajoute `tourist_tax_enabled` et
  `tourist_tax_per_person_per_night` sur `listings` (taux renseigné par l'hôte, propre à sa
  commune — Escale ne peut pas le déterminer automatiquement pour toute la France), et
  `tourist_tax_amount`/`tourist_tax_exempt_guests` sur `reservations`.
- **Invariant financier important** : `computeFees()` (`lib/stripe/client.ts`) exclut
  désormais le montant de la taxe de l'assiette de commission, dans les deux sens (ni la part
  Escale, ni la rétrocommission partenaire ne portent dessus) — la taxe reste intégralement
  dans le montant reversé à l'hôte, qui reste seul responsable de sa déclaration et de son
  versement à sa mairie. Testez ce calcul avant tout déploiement réel : une erreur ici
  reviendrait à faire payer une commission à Escale sur un montant qui ne lui appartient pas.
- `POST /api/reservations` calcule automatiquement le montant (taux × nuits × voyageurs non
  exonérés) et l'ajoute au total payé par le voyageur ; le nombre de voyageurs de moins de 18
  ans exonérés est déclaré par le voyageur lui-même à la réservation, non vérifié par Escale.
- Le formulaire de publication propose désormais un champ "Taxe de séjour" (étape Tarif &
  équipements), avec case à cocher et taux par personne/nuit.

⚠️ **Ce qui reste à construire** : le résumé de réservation (`DetailLogementClient.jsx`,
page détail logement) n'affiche pas encore la taxe comme ligne séparée ni ne permet au
voyageur de déclarer des voyageurs exonérés — la logique de calcul existe côté serveur,
mais l'API accepte `voyageursExoneres` sans que l'interface ne l'envoie encore. Le contrat de
location généré ne mentionne pas non plus ce montant pour l'instant.

## Reversement de la taxe de séjour aux communes

Depuis le 1er janvier 2019, une plateforme qui encaisse le paiement pour le compte d'hôtes
**non professionnels** — le cas d'Escale via Stripe Connect — est légalement **tenue** de
collecter la taxe de séjour et de la reverser aux communes concernées (Article L2333-34 du
CGCT), deux fois par an (30 juin et 31 décembre), au comptable public de chaque collectivité.

Il n'existe aucune API unifiée permettant de payer automatiquement les ~35 000 communes
françaises — même les grandes plateformes (Airbnb, Abritel...) gardent une équipe dédiée à
cette opération. Ce que ce dépôt automatise, c'est **l'agrégation** :

- `supabase/migrations/0026_reversement_taxe_sejour.sql` — table
  `tourist_tax_remittances` : montant dû par commune et par semestre, calculé automatiquement.
- `GET /api/admin/tourist-tax` — recalcule les montants dus pour le semestre en cours à
  partir des réservations réellement payées, sans jamais écraser une ligne déjà marquée
  "reversée".
- `PATCH /api/admin/tourist-tax/:id` — marque un reversement comme effectué (le virement
  lui-même se fait hors de l'application, cette route n'enregistre que la confirmation).
- Section "Taxe de séjour" dans le back-office admin, avec le montant total dû pour le
  semestre en cours et le détail par commune.

Pour automatiser réellement la **déclaration** (pas le virement), la DGFiP propose depuis
2024 **FARITAS**, un service de déclaration unique centralisée pour toute la France — déjà
utilisé par Abritel, Holidu ou Cocoonr, sur convention à signer avec l'administration
fiscale. Les données agrégées par ce dépôt (commune, semestre, montant, nombre de
réservations) correspondent à ce que FARITAS demande, mais aucun branchement technique avec
ce service n'a été fait ici — l'agrégat est prêt, l'intégration à FARITAS resterait à
construire si vous signez cette convention.

## Cautions gérées par Escale (fonctionnalité non activée par défaut)

Par défaut (Article 11 des CGU), la caution est une simple autorisation bancaire gérée
directement par le voyageur et l'hôte, sans qu'Escale n'y touche — **c'est le mode retenu
pour ce projet**. Le code ci-dessous existe dans le dépôt mais n'est **volontairement pas
activé** : il implémente une alternative où Escale gère activement la caution, si ce choix
devait être reconsidéré plus tard.

- Au paiement du séjour, si l'annonce prévoit une caution, la carte du voyageur est
  mémorisée (`setup_future_usage`) sans que le montant de la caution soit inclus dans ce
  paiement.
- `POST /api/deposits/authorize` — bloque le montant sur la carte (autorisation, pas de
  prélèvement) à la date d'arrivée. Un cron associé existe
  (`GET /api/cron/authorize-deposits`) mais n'est **pas déclaré** dans `vercel.json` — il ne
  se déclenchera pas tant qu'il n'y est pas ajouté.
- `POST /api/deposits/release` — libère l'autorisation sans rien prélever.
- `POST /api/deposits/capture` — prélève tout ou partie du montant autorisé et le reverse à
  l'hôte. Le bouton correspondant ("Dommage constaté — prélever la caution") reste visible
  dans le panneau de résolution des litiges du tableau de bord ; il échouera simplement tant
  qu'aucune caution n'a été autorisée en amont (ce qui n'arrivera jamais tant que le cron
  d'autorisation n'est pas activé).

⚠️ Si cette fonctionnalité est réactivée un jour : une autorisation bancaire par carte est
généralement valable 7 jours (parfois moins selon la banque émettrice du voyageur). Pour un
séjour plus long, l'autorisation doit être renouvelée périodiquement — non implémenté dans
cette version.

