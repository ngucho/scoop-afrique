# Déploiement sur Vercel — Landing, Frontend et Backend

Ce guide explique comment mettre en production les trois applications du monorepo Scoop Afrique sur **Vercel** (landing et frontend en priorité), et comment déployer le **backend** soit sur Vercel (Serverless/Edge avec Hono), soit sur un hébergeur Node externe (Railway, Render, etc.).

---

## Prérequis

- Compte [Vercel](https://vercel.com) (et optionnellement Railway ou Render pour le backend).
- Repo Git (GitHub, GitLab, Bitbucket) connecté à Vercel.
- Projet Supabase et tenant Auth0 configurés (voir `AUTH0_SETUP.md`, `SUPABASE_SETUP.md`).
- Variables d’environnement prêtes (voir `RUNBOOK.md`).

---

## 1. Configuration du monorepo pour Vercel

À la racine du repo, chaque application est dans un sous-dossier (`apps/landing`, `apps/frontend`, `apps/backend`). Sur Vercel, on crée **un projet par application** et on indique le **Root Directory** et le **Framework Preset**.

---

## 2. Déployer la Landing (`apps/landing`)

1. **Vercel** → New Project → importer le repo.
2. **Root Directory** : `apps/landing`.
3. **Framework Preset** : Next.js (détecté automatiquement).
4. **Build Command** : `pnpm build` (ou `cd ../.. && pnpm build:landing` si vous buildez depuis la racine).
5. **Install Command** : `pnpm install` (exécuté à la racine si Root Directory est `apps/landing`, selon la config Vercel ; pour un monorepo, souvent on définit **Root Directory** = racine du repo et **Root Directory** pour la build = `apps/landing` — en pratique, configurer **Root Directory** = `apps/landing` et dans les Settings du projet, **Build & Development** → **Override** : Build Command = `pnpm run build` en étant sûr que le `package.json` de `apps/landing` a un script `build`).

   Recommandation : **Root Directory** = `apps/landing`. Dans ce cas, Vercel peut ne pas voir le workspace. Alternative : **Root Directory** laissé vide (racine), puis dans **Build and Output Settings** :
   - **Root Directory** : `apps/landing`
   - **Build Command** : `pnpm install && pnpm run build` (depuis la racine : `pnpm --filter landing build` ou depuis `apps/landing` après install à la racine).

   Pour un monorepo pnpm, la méthode la plus fiable est :
   - **Root Directory** : (vide = racine du repo)
   - **Build Command** : `pnpm install && pnpm --filter landing build`
   - **Output Directory** : `apps/landing/.next` (Next.js)
   - **Install Command** : `pnpm install`

6. **Variables d’environnement** : ajouter toutes les variables nécessaires à la landing (pas de secret backend ; éventuellement `NEXT_PUBLIC_*` si utilisé).
7. **Domaine** : attribuer un domaine (ex. `www.scoop-afrique.com` ou sous-domaine dédié).

Résumé recommandé pour **landing** avec monorepo :

| Paramètre        | Valeur                                      |
|------------------|---------------------------------------------|
| Root Directory   | `apps/landing`                              |
| Framework        | Next.js                                     |
| Build Command   | `cd ../.. && pnpm install && pnpm --filter landing build` (si Root = `apps/landing`, alors juste `pnpm run build` depuis ce dossier) |
| Output Directory | `.next` (par défaut Next.js)                 |

Si vous laissez la racine comme root : **Root Directory** vide, **Build Command** : `pnpm install && pnpm --filter landing build`, **Output Directory** : `apps/landing/.next`.

---

## 3. Déployer le Frontend (`apps/frontend`)

1. **New Project** sur Vercel → même repo.
2. **Root Directory** : `apps/frontend`.
3. **Framework Preset** : Next.js.
4. **Build Command** : depuis la racine du monorepo, `pnpm --filter frontend build` ; si Root Directory = `apps/frontend`, alors `pnpm run build` (avec install à la racine ou en configurant Vercel pour monorepo).

   Configuration type monorepo (racine = root) :
   - **Root Directory** : `apps/frontend`
   - **Build Command** : `pnpm run build` (Vercel exécute depuis `apps/frontend` ; il faut que l’install ait été faite au niveau monorepo — souvent Vercel détecte le `pnpm-workspace.yaml` à la racine si on ne met pas de Root Directory, donc pour éviter les pièges, on peut mettre **Root Directory** à la racine et **Build Command** : `pnpm install && pnpm --filter frontend build`, **Output Directory** : `apps/frontend/.next`).

5. **Variables d’environnement** (obligatoires) :
   - `NEXT_PUBLIC_API_URL` : URL de l’API backend (ex. `https://api.scoop-afrique.com` ou l’URL Vercel du backend).
   - `NEXT_PUBLIC_SITE_URL` : URL publique du frontend (ex. `https://app.scoop-afrique.com`).
   - Variables Auth0 (voir `apps/frontend/.env.example`) : `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE` (ou équivalent selon le SDK utilisé).
6. **Domaine** : ex. `app.scoop-afrique.com` ou `lecteur.scoop-afrique.com`.

---

## 4. Déployer le Backend sur Vercel (option Serverless / Edge)

Le backend est une app **Hono + Node**. Vercel peut exécuter Hono en **Serverless** ou **Edge**. Les dépendances Node (Supabase, etc.) fonctionnent en Serverless ; pour Edge, il faut rester compatible (pas de Node pur).

### 4.1 Adapter le backend pour Vercel

Le backend est configuré pour Vercel en **zero-config** : l’app Hono est exposée depuis `apps/backend/src/index.ts`.

1. **Export par défaut** : Dans `src/index.ts`, l’app Hono est exportée en `export default app`. Vercel détecte automatiquement un fichier à `index.ts` ou `src/index.ts` et utilise cet export comme handler Serverless.

2. **Serveur Node uniquement en local** : Le `serve()` Node (`@hono/node-server`) n’est exécuté que si `VERCEL` n’est pas défini, afin de ne pas lancer de serveur HTTP sur Vercel.

3. **Configuration Vercel pour le backend** :
   - **New Project** → même repo.
   - **Root Directory** : `apps/backend`.
   - **Framework Preset** : Other (ou Vercel ne détecte pas Next.js).
   - **Build Command** : `pnpm run build` (ou depuis racine : `pnpm --filter backend build`).
   - **Output Directory** : laisser vide ou selon la doc Hono/Vercel.
   - **Rewrite** : pour que toutes les requêtes aillent vers la fonction Serverless, configurer dans **Settings → Functions** (ou `vercel.json`) la route qui pointe vers `api/index.ts` (ou le fichier d’entrée).

4. **vercel.json** (à la racine de `apps/backend`) : optionnel ; peut contenir `buildCommand` et `framework: "hono"` pour le build.

5. **Variables d’environnement** : toutes celles du backend (Supabase, Auth0, CORS, etc.). **CORS** : mettre `CORS_ORIGINS` avec les URLs de production (landing, frontend).

### 4.2 Limites et alternatives

- **Cold start** et **timeout** : en Serverless, les requêtes longues (upload, traitements lourds) peuvent être limitées. Si besoin de processus longs ou de WebSockets, envisager un hébergeur Node dédié.
- **Alternative recommandée si le backend doit tourner en continu** : déployer le backend sur **Railway**, **Render** ou **Fly.io** en tant que service Node (commande `node dist/index.js` ou `pnpm start`), puis définir `NEXT_PUBLIC_API_URL` du frontend sur l’URL de ce service.

---

## 5. Déployer le Backend sur Railway ou Render (alternative)

1. **Railway** : New Project → Deploy from GitHub → sélectionner le repo, **Root Directory** : `apps/backend`. Build : `pnpm install && pnpm run build`. Start : `pnpm start` (ou `node dist/index.js`). Ajouter les variables d’environnement. Railway expose une URL publique (ex. `https://xxx.railway.app`).
2. **Render** : Web Service → connecter le repo, **Root Directory** : `apps/backend`, Build : `pnpm install && pnpm run build`, Start : `pnpm start`. Variables d’environnement idem. Renseigner l’URL du service dans `NEXT_PUBLIC_API_URL`.

Dans les deux cas, configurer **CORS** côté backend (`CORS_ORIGINS`) avec les origines autorisées (URL de la landing, du frontend, et éventuellement un domaine API personnalisé).

---

## 6. Résumé des URLs et variables

| App      | URL type (exemple)        | Variables critiques |
|----------|----------------------------|----------------------|
| Landing  | `https://www.scoop-afrique.com` | (optionnel) `NEXT_PUBLIC_SITE_URL` |
| Frontend | `https://app.scoop-afrique.com` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, Auth0 |
| Backend  | `https://api.scoop-afrique.com` | Supabase, Auth0, `CORS_ORIGINS` (inclure landing + frontend) |

Après déploiement :

1. Vérifier que le frontend appelle bien le bon `NEXT_PUBLIC_API_URL`.
2. Dans Auth0 : ajouter les URLs de callback et logout de production pour le frontend.
3. Tester login admin, lecture d’articles, newsletter et likes.

---

## 7. Checklist post-déploiement

- [ ] Landing : sitemap, robots, manifest accessibles ; métadonnées et OG corrects.
- [ ] Frontend : login/logout admin, chargement des articles et catégories, likes, newsletter.
- [ ] Backend : health check (`GET /`), CORS OK depuis le frontend, JWT validés.
- [ ] Auth0 : tenants et applications configurés pour la production ; Action Post-Login déployée.
- [ ] Supabase : migrations appliquées en production ; clés et URL de production utilisées par le backend.

Pour plus de détails sur l’architecture et l’API, voir **ARCHITECTURE.md**, **API.md** et **DOCUMENTATION_COMPLETE.md**.
