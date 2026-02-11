# Scoop Afrique — Documentation complète du projet

Cette documentation décrit l’ensemble du monorepo **Scoop Afrique** : objectifs, architecture, applications, design system, API, authentification et déploiement. Elle est rédigée en français et mise à jour pour refléter l’état actuel du projet.

---

## 1. Vue d’ensemble du projet

### 1.1 Objectif

**Scoop Afrique** est le média digital panafricain qui « décrypte l’Afrique autrement ». Ce dépôt contient :

- **Landing** : site vitrine (partenariats, publicité, contact).
- **Frontend** : webapp lecteur (articles, vidéos, podcasts, newsletter) + espace rédaction/admin.
- **Backend** : API REST (articles, catégories, commentaires, newsletter, auth, admin).
- **Design system (scoop)** : composants et thème partagés (Tailwind v4, Atomic Design).

À long terme, le frontend évoluera vers une plateforme de streaming (VOD) et des podcasts intégrés ; les pages Vidéo et Podcast sont déjà préparées pour cela.

### 1.2 Stack technique

| Élément        | Technologie                          |
|----------------|--------------------------------------|
| Landing       | Next.js 16 (App Router)               |
| Frontend      | Next.js 16 (App Router), Auth0       |
| Backend       | Hono + Node.js, TypeScript, ESM      |
| Base de données | Supabase (PostgreSQL)              |
| IAM           | Auth0 (seul fournisseur d’identité)  |
| Design system | React, Tailwind v4, package `scoop` |

### 1.3 Structure du monorepo

```
/
├── apps/
│   ├── landing/     # Site vitrine (Next.js)
│   ├── frontend/    # Webapp lecteur + admin (Next.js)
│   └── backend/     # API REST (Hono/Node)
├── packages/
│   └── scoop/       # Design system (atoms, molecules, organisms, theme)
├── docs/            # Documentation (ce fichier, API, runbook, déploiement…)
├── supabase/
│   └── migrations/  # Schéma SQL (articles, profiles, categories, etc.)
├── pnpm-workspace.yaml
└── package.json
```

---

## 2. Applications

### 2.1 Landing (`apps/landing`)

- **Rôle** : site vitrine pour partenariats, publicité et couverture médiatique.
- **Pages** : accueil, à propos, contact, vidéo, podcast, mentions légales, politique de confidentialité.
- **SEO** : robots.txt, sitemap, manifest, métadonnées, JSON-LD.
- **Port en dev** : 3000.

### 2.2 Frontend (`apps/frontend`)

- **Rôle** : webapp pour les lecteurs (articles, catégories, recherche, newsletter, vidéos, podcasts) et pour la rédaction (admin protégé par Auth0).
- **Côté lecteur** :
  - Accueil, liste d’articles, article par slug, catégories dynamiques (basées sur l’API).
  - Pages Vidéo (VOD à venir, YouTube embeds pour l’instant) et Podcast (à venir).
  - Recherche, newsletter, likes (anonymes ou connectés).
- **Côté admin** : tableau de bord, articles (éditeur TipTap), catégories, commentaires, médias, profil (métadonnées Auth0), équipe.
- **Port en dev** : 3001.

### 2.3 Backend (`apps/backend`)

- **Rôle** : API REST unique pour le frontend. Pas d’UI.
- **Endpoints publics** : health, articles (liste, détail, likes), catégories, newsletter, commentaires (lecture).
- **Endpoints protégés** : `/api/v1/admin/*` (articles, commentaires, catégories, médias, profil, utilisateurs Auth0, etc.) et `/api/v1/auth/me`. Authentification par JWT Auth0 (Bearer).
- **Port en dev** : 4000.

---

## 3. Design system (`packages/scoop`)

- **Méthodologie** : Atomic Design (atoms, molecules, organisms, patterns).
- **Styles** : Tailwind v4, variables CSS dans `theme.css` (couleurs, typo, espacements). Thème clair par défaut ; mode sombre via `.dark` sur `<html>`.
- **Couleur primaire** : rouge Scoop (signal, CTA). Police logo : Brasika (variable `--font-scoop`).
- **Composants** : Button, Dot, Text, Heading, Card, GlitchText, ThemeToggle, etc. Exportés depuis le package et utilisés par landing et frontend.
- **Storybook** : `pnpm --filter scoop storybook` pour développer et visualiser les composants.

---

## 4. Base de données et Auth0

- **Supabase** : PostgreSQL. Tables principales : `profiles`, `articles`, `categories`, `article_likes`, `comments`, `media`, `article_revisions`, `article_collaborators`, etc. Migrations dans `supabase/migrations/`.
- **Auth0** : seul fournisseur d’identité. Rôles (journalist, editor, manager, admin) via permissions dans le JWT. Métadonnées utilisateur (nom, adresse, téléphone, sexe) dans un claim personnalisé (`https://scoop-afrique.com/user_metadata`) ajouté par une Action Post-Login ; le frontend les lit depuis le payload du **access token**, pas depuis la session seule.
- **Documentation détaillée** : `AUTH0_SETUP.md`, `SUPABASE_SETUP.md`, `RBAC.md`, `API.md`.

---

## 5. API (résumé)

- **Base** : `{API_BASE}/api/v1`.
- **Format** : JSON. Succès : `{ data: T }` ou `{ data: T[], total?: number }`. Erreur : `{ error: string, code?: string }`.
- **Public** : `GET /`, `GET /articles`, `GET /articles/:id`, `GET /articles/:id/likes`, `POST /articles/:id/likes`, `GET /categories`, `GET /categories/:slug`, newsletter, commentaires (lecture).
- **Protégé** : tous les `admin/*` et `GET /auth/me` avec `Authorization: Bearer <access_token>`.
- Référence complète : `docs/API.md`.

---

## 6. Développement local

- **Prérequis** : Node.js 20+, pnpm 9+.
- **Installation** : à la racine, `pnpm install`.
- **Variables d’environnement** : copier les `.env.example` dans chaque app et renseigner Auth0, Supabase, CORS, etc. Voir `RUNBOOK.md`.
- **Migrations** : `npx supabase db push` (ou exécuter les SQL à la main dans Supabase).
- **Lancement** :
  - `pnpm dev` : toutes les apps en parallèle.
  - `pnpm dev:landing`, `pnpm dev:frontend`, `pnpm dev:backend` : une seule app.
- **Build** : `pnpm build` à la racine pour tout compiler.

---

## 7. Déploiement

Le déploiement sur **Vercel** (landing, frontend, backend) est décrit en détail dans **`docs/DEPLOYMENT_VERCEL.md`**. Résumé :

- **Landing** et **Frontend** : déploiement Next.js standard (projet Vercel par app, variables d’environnement, domaines).
- **Backend** : déployable sur Vercel en tant que backend Hono (Serverless/Edge) ou sur un hébergeur Node (Railway, Render, etc.) selon les contraintes (Supabase, durée des requêtes, etc.).

---

## 8. Index des documents

| Document | Description |
|----------|-------------|
| **DOCUMENTATION_COMPLETE.md** | Ce fichier — vue d’ensemble et explications en français. |
| **DEPLOYMENT_VERCEL.md** | Guide pas à pas : déployer landing, frontend et backend (Vercel et alternatives). |
| **ARCHITECTURE.md** | Schémas et description technique de l’architecture. |
| **API.md** | Référence de l’API REST (endpoints, auth, formats). |
| **AUTH0_SETUP.md** | Configuration Auth0 (tenant, API, rôles, Action Post-Login). |
| **SUPABASE_SETUP.md** | Configuration Supabase (projet, migrations, RLS). |
| **RBAC.md** | Rôles et permissions (journalist, editor, manager, admin). |
| **RUNBOOK.md** | Démarrage rapide, variables d’environnement, commandes utiles, redirections admin. |
| **editorial-workflow.md** | Workflow éditorial (brouillon, révision, publication). |

---

**Scoop Afrique** — Le media digital qui décrypte l’Afrique autrement.
