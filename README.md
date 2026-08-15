# Escale — app de réservation de logements

## Stack
- Next.js 14 (App Router) + TypeScript
- PostgreSQL (Supabase ou Neon) via `pg`
- NextAuth (authentification par email/mot de passe)
- Stripe (paiement)

## Démarrage

1. `npm install`
2. Copier `.env.example` en `.env.local` et renseigner les valeurs
   (chaîne de connexion PostgreSQL, secrets NextAuth, clés Stripe)
3. Exécuter `schema_base_de_donnees.sql` sur votre base PostgreSQL
   (via l'éditeur SQL de Supabase, ou `psql`)
4. `npm run dev`

## Structure du projet

```
escale/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   → connexion / session
│   │   ├── listings/route.ts             → liste + création de logements
│   │   └── bookings/route.ts             → création de réservation + paiement Stripe
│   └── logements/[id]/                   → page détail d'un logement (à construire)
├── lib/
│   ├── db.ts       → connexion PostgreSQL (pool réutilisé)
│   └── auth.ts      → configuration NextAuth
├── components/                            → composants réutilisables (à construire,
│                                             sur la base du style de la maquette "Escale")
└── schema_base_de_donnees.sql
```

## À faire ensuite
- Brancher `getServerSession(authOptions)` dans les routes `listings` et `bookings`
  pour remplacer les `REMPLACER_PAR_..._ID_SESSION`
- Construire les pages (recherche, fiche logement, tunnel de réservation)
  en réutilisant les composants de la maquette visuelle
- Ajouter l'upload de photos (ex. Supabase Storage)
- Ajouter le webhook Stripe pour confirmer les paiements côté serveur
