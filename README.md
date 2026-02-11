# Scoop.Afrique — Monorepo

Monorepo **pnpm** pour **Scoop.Afrique** : design system partagé (**scoop**) et trois applications — **landing**, **frontend** (webapp média), **backend** (API).

> **Note** : Le vrai Scoop.Afrique s'écrit avec un **point** (Scoop.Afrique).

## Structure du monorepo

| Cible | Rôle |
|-------|------|
| **`apps/landing`** | Site vitrine actuel (Next.js). En ligne en attendant la webapp. |
| **`apps/frontend`** | Future webapp : articles, likes, commentaires, newsletter, annonces, espace employés (rédaction, accès, articles, perf, encarts pub, partenaires). |
| **`apps/backend`** | API (Hono + Node) : articles, auth, newsletter, annonces, admin. Couche métier, sécurité, pas d’UI. |
| **`packages/scoop`** | Design system (Atomic Design, Tailwind v4, style shadcn). **Une seule source de vérité** pour l’UI ; utilisé par landing et frontend. |

```
/
  apps/
    landing/          # Next.js — vitrine (hero, manifeste, publications, a-propos, contact, etc.)
    frontend/         # Next.js — webapp (articles, newsletter, admin)
    backend/          # Hono/Node — API (health, articles, auth à venir)
  packages/
    scoop/            # Design system (atoms, molecules, organisms, patterns, theme)
  pnpm-workspace.yaml # apps/*, packages/*
  package.json       # Scripts racine (dev, build par app)
```

## Prérequis et installation

- **Node** 20+
- **pnpm** 9+

```bash
# À la racine du repo
pnpm install
```

En cas d’erreur **« Unexpected store location »** avec pnpm, exécuter une seule fois à la racine : `pnpm install`, ou configurer le store global : `pnpm config set store-dir <chemin> --global`.

## Build et vérification

Tout le monorepo (scoop, landing, frontend, backend) :

```bash
pnpm build
```

Build par application :

```bash
pnpm build:landing    # Next.js landing
pnpm build:frontend   # Next.js webapp
pnpm build:backend    # Compilation TypeScript backend
```

Pour vérifier que tout se build correctement : exécuter `pnpm build` à la racine. Aucune erreur = packages et apps OK.

## Développement

Lancer une seule app :

```bash
pnpm dev:landing      # http://localhost:3000
pnpm dev:frontend     # http://localhost:3001
pnpm dev:backend      # http://localhost:4000
```

Lancer toutes les apps en parallèle :

```bash
pnpm dev
```

## Design system : package `scoop`

- **Thème par défaut** : clair (dark via `.dark` sur `<html>`).
- **Couleur primaire** : `#FF3131` (Scoop Red).
- **Police logo** : Brasika.
- **Curseur** : simple (anneau + point) pour ne pas distraire.

### Structure `packages/scoop/src/`

- **theme.css** — Variables CSS (light/dark), keyframes, `@theme` Tailwind v4  
- **utils/cn.ts** — `cn()` (clsx + tailwind-merge)  
- **atoms** — Button, Dot, Text, Badge, Link, Separator, Heading  
- **molecules** — SectionHeader, Card, GlitchText, MarqueeBand, ThemeToggle, Blockquote, FillHoverAnchor, NavLinksList, BackLink  
- **patterns** — AfricanPattern  
- **organisms** — CursorTracker  
- **providers** — ThemeProvider  

### Storybook (visualisation et développement)

Le package `scoop` inclut **Storybook** pour visualiser et développer les composants. Les logos du média (Scoop.Afrique) sont utilisés dans la marque Storybook et dans la page d’introduction.

```bash
# Depuis la racine
pnpm --filter scoop storybook

# Ou depuis packages/scoop
cd packages/scoop && pnpm storybook
```

- **URL** : http://localhost:6006  
- **Contenu** : page Introduction (avec logo), stories pour tous les atomes, molécules, organismes et patterns.  
- **Thème** : bascule Light/Dark dans la toolbar.  
- **Build statique** : `pnpm --filter scoop build-storybook` (sortie dans `packages/scoop/storybook-static`).

### Utilisation dans une app

- Dans le CSS global de l’app : `@import 'scoop/theme.css'` après Tailwind.
- Composants : `import { Button, GlitchText, CursorTracker } from 'scoop'`.
- Les apps n’inventent pas de composants UI : tout vient de `scoop` (ou de class names SSR-safe exposés par l’app, ex. `lib/landing.ts` dans la landing).

## Landing (`apps/landing`)

- **Next.js** App Router, SEO (robots, sitemap, métadonnées, JSON-LD), headers de sécurité.
- **Pages** : `/`, `/a-propos`, `/contact`, `/mentions-legales`, `/politique-de-confidentialite`.
- **Composants** : `components/` (hero, manifeste, why, publications, social-cta, footer) utilisent uniquement `scoop` et `lib/landing.ts` (class names SSR-safe).
- **Assets** : `apps/landing/public/` (fonts, publications, favicons).
- **Scripts** : `apps/landing/scripts/resize-publications.mjs` pour redimensionner les images de publications (ex. depuis la racine : `node apps/landing/scripts/resize-publications.mjs` ; nécessite `sharp` dans `apps/landing`).

## Frontend (`apps/frontend`)

- **Next.js** webapp : pages publiques (articles, newsletter), espace admin (login, tableau de bord), `not-found`, `loading`.
- **UI** : 100 % `scoop` ; config API dans `lib/config.ts`, client API dans `lib/api/client.ts`.
- **Middleware** : protection des routes `/admin/*` (sauf `/admin/login`) ; redirection vers login si non authentifié (à brancher sur session backend).
- **Séparation** : Server Components par défaut ; client uniquement quand nécessaire.
- **Env** : copier `apps/frontend/.env.example` en `.env.local` et renseigner `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`.

## Backend (`apps/backend`)

- **Hono** sur Node ; ESM, TypeScript.
- **Structure** : `src/config`, `src/middleware` (CORS, security headers), `src/routes` (health, articles, auth, newsletter), `src/services/` (couche métier à venir).
- **Sécurité** : CORS restreint, headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy), pas de secrets en dur.
- **API** : `/` (health), `/api/v1/articles`, `/api/v1/auth` (login, logout, me), `/api/v1/newsletter` (subscribe, unsubscribe). Placeholders à connecter DB et auth.
- **Env** : copier `apps/backend/.env.example` en `.env` et renseigner `PORT`, `CORS_ORIGINS`, `API_PREFIX`.

## Informations clés

| Élément | Valeur |
|---------|--------|
| **Email** | Contact@scoop-afrique.com |
| **Localisation** | Abidjan, Côte d'Ivoire |
| **Réseaux** | TikTok @Scoop.Afrique, Facebook, Threads, Instagram, YouTube |

## Documentation

La documentation complète (architecture, API, auth, déploiement) est dans le dossier **`docs/`** :

- **[docs/README.md](docs/README.md)** — Index de toute la documentation.
- **[docs/DOCUMENTATION_COMPLETE.md](docs/DOCUMENTATION_COMPLETE.md)** — Vue d’ensemble du projet en français (objectifs, stack, apps, design system, déploiement).
- **[docs/DEPLOYMENT_VERCEL.md](docs/DEPLOYMENT_VERCEL.md)** — Déploiement sur Vercel : landing, frontend et backend (avec alternatives Railway/Render).

## Checklist pré-production (landing)

- [ ] Domaine et `BASE_URL` à jour dans `apps/landing`
- [ ] `og-image.png` (1200×630) et favicons en place
- [ ] Logo et vidéo hero configurés
- [ ] Vérification sitemap / Search Console et headers de sécurité

---

**Scoop.Afrique** — Le media digital qui décrypte l'Afrique autrement.
