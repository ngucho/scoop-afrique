# Subscriber accounts and digest — runbook

This document describes the reader (subscriber) Auth0 flow, account UI, digest job, email delivery tracking, and compliance hooks added for the redesign.

## Architecture

- **Staff / admin** continues to use the existing Auth0 application (`AUTH0_CLIENT_ID`) and routes under `/auth/*`. Access tokens must **not** use the reader client id (`azp`); the backend rejects those tokens for staff APIs.
- **Readers** use a **second Auth0 application** (Regular Web Application) with credentials `READER_AUTH0_CLIENT_ID` / `READER_AUTH0_CLIENT_SECRET`. The Next.js app mounts a separate Auth0 SDK client with:
  - Routes under `/reader/auth/login`, `/reader/auth/callback`, `/reader/auth/logout`
  - Session cookie name `__session_reader` (admin keeps `__session`)
- Both apps request the **same API audience** (`AUTH0_AUDIENCE`) so the backend issues comparable JWTs. The backend distinguishes readers by `azp === AUTH0_READER_CLIENT_ID`.

## Auth0 dashboard checklist (reader app)

1. Create application: **Regular Web Application**, name e.g. `Scoop Afrique Readers`.
2. **Allowed Callback URLs**: `https://<frontend>/reader/auth/callback` (local: `http://localhost:3001/reader/auth/callback`).
3. **Allowed Logout URLs**: site origin (e.g. `http://localhost:3001`, production origin).
4. **Allowed Web Origins**: same as frontend base URL.
5. Authorize this application for the **same API** as the backoffice (Applications → APIs → your API → authorize app, grant at least `openid profile email` for login; RBAC permissions can be empty for pure readers).
6. Copy **Client ID** → `AUTH0_READER_CLIENT_ID` (frontend) and `AUTH0_READER_CLIENT_ID` (backend — same value).
7. Copy **Client Secret** → `READER_AUTH0_CLIENT_SECRET` (frontend only; not required on backend for JWT validation).

## Environment variables

### Frontend (`apps/frontend`)

| Variable | Purpose |
|----------|---------|
| `READER_AUTH0_CLIENT_ID` | Reader Auth0 application |
| `READER_AUTH0_CLIENT_SECRET` | Reader application secret |
| `AUTH0_DOMAIN`, `AUTH0_SECRET`, `APP_BASE_URL`, `AUTH0_AUDIENCE` | Shared with admin; `AUTH0_SECRET` encrypts both session cookies unless `READER_AUTH0_SECRET` is set |

### Backend (`apps/backend`)

| Variable | Purpose |
|----------|---------|
| `AUTH0_READER_CLIENT_ID` | Reject staff profile sync for `azp` = reader; require for `/api/v1/reader/*` |
| `PUBLIC_SITE_URL` | Canonical links and unsubscribe redirects (set to `http://localhost:3001` in local dev) |
| `DIGEST_CRON_SECRET` | Shared secret for `POST /api/v1/digest/run` |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Send digests |
| `RESEND_WEBHOOK_SECRET` | Svix secret from Resend webhooks (`whsec_...`) |

## Database

Migration `0027_reader_digest.sql` adds:

- `reader_subscribers` — keyed by Auth0 `sub`, topic preferences (`topic_category_ids`), `digest_frequency`, `unsubscribe_token`, `next_digest_at`
- `email_outbound` — Resend message id + delivery status
- `digest_job_runs` — batch metrics

Run migrations in each environment (`pnpm --filter @scoop-afrique/backend run db:migrate` or your pipeline).

## API surface

| Method | Path | Auth | Description |
|--------|------|------|---------------|
| GET/PATCH | `/api/v1/reader/me` | Bearer (reader `azp`) | Load/update subscriber row |
| POST | `/api/v1/digest/run` | Header `x-digest-cron-secret: <DIGEST_CRON_SECRET>` | Run digest for one frequency (`daily` / `weekly` / `monthly`) |
| POST | `/api/v1/digest/webhooks/resend` | Svix signature | Update `email_outbound` from Resend events |
| GET | `/api/v1/digest/unsubscribe?t=...` | Public | One-click unsubscribe → redirect to `/account?digest=...` |

Cron example (body JSON):

```json
{ "frequency": "weekly", "dry_run": false }
```

Schedule three jobs (daily / weekly / monthly) with appropriate secrets and monitoring.

## Frontend routes

- `/account/login` — marketing page with link to `/reader/auth/login?returnTo=/account`
- `/account` — preferences (protected; requires reader session)

The browser calls `PATCH /api/reader/me` on the Next.js app, which proxies to the backend with the reader access token.

## Digest selection logic

The job loads recent published articles, ranks them by:

1. **Recency** (inverse square root of age)
2. **Popularity** (`view_count`, log-scaled)
3. **Editorial tags** — bonus if tags match a small internal list (e.g. focus, editorial)

If the subscriber selected topic categories, we prefer articles in those categories; if fewer than three match, we top up from the global ranked list.

## Compliance

- Marketing emails include **List-Unsubscribe** and **List-Unsubscribe-Post** headers (one-click).
- Token-based **GET unsubscribe** clears digest scheduling and sets frequency to `off`.
- **Resend webhooks** map `email.delivered`, `email.bounced`, `email.complained`, `email.failed` into `email_outbound.status` for operational visibility.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Admin API 401 after reader login | You are using the reader token; log out of reader or use admin login (`/auth/login`) |
| Reader `/api/v1/reader/*` 503 | `AUTH0_READER_CLIENT_ID` missing on backend |
| Digest not sent | `RESEND_*`, DB migration, subscriber `next_digest_at` and `digest_frequency` |
| Webhook 400 | Raw body, `RESEND_WEBHOOK_SECRET`, Svix headers present |
