# Escale

Application de location de logements entre particuliers.

L'application se trouve **dans le sous-répertoire [`escale/`](escale/)**, pas à la racine
de ce dépôt. Toute la documentation utile est dans [`escale/README.md`](escale/README.md) :
architecture, mise en route, variables d'environnement, migrations Supabase et
déploiement.

```
escale/                   L'application (Next.js App Router + Supabase + Stripe Connect)
├── README.md             Documentation complète — commencez ici
├── .env.example          Variables d'environnement requises
├── supabase/migrations/  Schéma de base de données, à exécuter dans l'ordre numérique
└── docs/                 Documents contractuels
```

## Démarrage rapide

```bash
cd escale
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

## Déploiement

Le dépôt ne contient qu'une application, mais elle n'est pas à la racine : chaque projet
Vercel branché sur ce dépôt doit avoir son **Root Directory réglé sur `escale`**, et les
variables d'environnement listées dans `escale/.env.example` renseignées. Un projet dont
le Root Directory pointe sur la racine n'a rien à construire et échouera.
