# Documentation — Scoop Afrique

Bienvenue dans la documentation du monorepo **Scoop Afrique**. Tous les documents sont en français sauf indication contraire.

---

## Entrée principale

- **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** — **Guide complet** : setup Supabase, Auth0, Twilio, Resend, migrations, troubleshooting. À consulter pour toute configuration.
- **[DOCUMENTATION_COMPLETE.md](./DOCUMENTATION_COMPLETE.md)** — Vue d'ensemble du projet, architecture, applications, design system, API, auth et déploiement.

---

## Déploiement

- **[DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)** — Guide pas à pas pour déployer la **brands**, le **frontend**, le **CRM** et le **backend** sur Vercel (et alternatives Railway/Render pour le backend).

---

## Architecture et technique

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Schémas système, apps, packages, routes frontend/backend. |
| [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) | Règles migrations Drizzle, éviter dérive schéma / code, `verify:reader-ads-schema`. |
| [API.md](./API.md) | Référence de l'API REST (endpoints, auth, formats de réponse). |
| [RUNBOOK.md](./RUNBOOK.md) | Démarrage rapide, variables d'environnement, commandes utiles. |

---

## Authentification et données

| Document | Description |
|----------|-------------|
| [AUTH0_SETUP.md](./AUTH0_SETUP.md) | Configuration Auth0 (tenant, API, rôles, Action Post-Login, GET /auth/me et 401). |
| [RBAC.md](./RBAC.md) | Rôles et permissions (journalist, editor, manager, admin). |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Configuration Supabase (projet, migrations, RLS). Voir [PROJECT_GUIDE §3](./PROJECT_GUIDE.md#3-supabase-setup--complete-tutorial) pour le tutoriel complet. |

---

## Rédaction et admin

| Document | Description |
|----------|-------------|
| [editorial-workflow.md](./editorial-workflow.md) | Workflow éditorial (brouillon, révision, publication, collaborateurs). |

---

## Actions Auth0

| Document | Description |
|----------|-------------|
| [auth0-actions/README.md](./auth0-actions/README.md) | Présentation des Actions Auth0 utilisées. |
| [auth0-actions/post-login-add-user-metadata.js](./auth0-actions/post-login-add-user-metadata.js) | Action Post-Login : rôle reader + claim `user_metadata`. |
| [auth0-actions/post-user-registration-assign-reader.js](./auth0-actions/post-user-registration-assign-reader.js) | Action Post User Registration : assigne `reader` au premier signup. |

---

## Autres

- **scoop-afrique/** — Documents métier (analyse, statut entreprise, etc.).
- **archive/** — Documents dépréciés (remplacés par PROJECT_GUIDE ou obsolètes).

---

**Scoop Afrique** — Le media digital qui décrypte l'Afrique autrement.
