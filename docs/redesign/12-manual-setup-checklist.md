# Manual setup checklist (operators)

Use this checklist to configure production/staging after the redesign rollout.  
Scope: reader, admin, ads, subscriber accounts, digest delivery, observability.

## 1) Environment variables

## 1.1 Frontend (`apps/frontend`)

Required:

- [ ] `NEXT_PUBLIC_API_URL` (backend public URL)
- [ ] `NEXT_PUBLIC_SITE_URL` (reader canonical URL)
- [ ] `AUTH0_DOMAIN`
- [ ] `AUTH0_CLIENT_ID`
- [ ] `AUTH0_CLIENT_SECRET`
- [ ] `AUTH0_SECRET`
- [ ] `APP_BASE_URL`
- [ ] `AUTH0_AUDIENCE`

Reader-account specific:

- [ ] `READER_AUTH0_CLIENT_ID`
- [ ] `READER_AUTH0_CLIENT_SECRET`
- [ ] Optional `READER_AUTH0_SECRET` (or reuse `AUTH0_SECRET`)

Validation:

- [ ] `/admin/login` works with staff app.
- [ ] `/account/login` opens reader auth flow.
- [ ] `/account` is protected and loads after login.

## 1.2 Backend (`apps/backend`)

Required:

- [ ] `DATABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `AUTH0_DOMAIN`
- [ ] `AUTH0_AUDIENCE`
- [ ] `AUTH0_READER_CLIENT_ID`
- [ ] `CORS_ORIGINS`
- [ ] `API_PREFIX` (default `/api/v1`)

Digest/email:

- [ ] `PUBLIC_SITE_URL`
- [ ] `DIGEST_CRON_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`
- [ ] `RESEND_WEBHOOK_SECRET`

Validation:

- [ ] `GET /` (health) returns status `ok`.
- [ ] `GET /api/v1/announcements` and `/api/v1/ads/placements` respond.
- [ ] `POST /api/v1/digest/run` rejects invalid/missing secret (401).

---

## 2) Auth0 setup

## 2.1 Staff/admin application

- [ ] Callback URL includes frontend admin callback path (`/auth/callback`).
- [ ] Logout URL includes frontend origin.
- [ ] API audience authorized.
- [ ] Roles (`editor`, `manager`, `admin`) mapped correctly.

## 2.2 Reader application (separate app)

- [ ] Create separate Auth0 application for reader accounts.
- [ ] Callback URL includes `/reader/auth/callback`.
- [ ] Logout URL includes frontend origin.
- [ ] API audience authorized.
- [ ] Client ID copied to both:
  - frontend `READER_AUTH0_CLIENT_ID`
  - backend `AUTH0_READER_CLIENT_ID`
- [ ] Client secret set only on frontend (`READER_AUTH0_CLIENT_SECRET`).

Validation:

- [ ] Reader token can access `/api/v1/reader/me`.
- [ ] Reader token cannot access staff-only admin routes.

---

## 3) Database and migrations

- [ ] Run backend migrations in target environment.
- [ ] Confirm redesigned tables/columns exist (reader platform + digest).
- [ ] Confirm seed data for ad slots/homepage sections is present.

Validation queries (examples):

- [ ] Ad slots table has expected keys (`GLOBAL_TOP_BANNER`, `ARTICLE_RAIL`, etc.).
- [ ] Newsletter/subscriber tables include digest fields.
- [ ] Audit log table receives entries after admin mutations.

---

## 4) Ad operations setup

- [ ] Populate/verify ad slot inventory in admin (`/admin/reader/ads`).
- [ ] Create at least one campaign and creative for key slots:
  - [ ] `GLOBAL_TOP_BANNER`
  - [ ] `HOME_MID_1`
  - [ ] `ARTICLE_MID`
  - [ ] `ARTICLE_RAIL`
- [ ] Define fallback policy for empty slots (house or placeholder).
- [ ] Confirm legal ad labeling (“Publicité”/“Sponsor”) is visible.

Validation:

- [ ] Empty slot collapses or shows fallback without layout break.
- [ ] Impression/click events are emitted and stored.

---

## 5) Newsletter and digest operations

## 5.1 Resend

- [ ] Sender domain configured and verified.
- [ ] `RESEND_FROM_EMAIL` uses verified sender.
- [ ] Webhook endpoint configured: `/api/v1/digest/webhooks/resend`.
- [ ] Webhook secret matches backend env.

## 5.2 Cron scheduler

Configure three digest triggers (or equivalent scheduler):

- [ ] Daily: `POST /api/v1/digest/run` with body `{ "frequency": "daily" }`
- [ ] Weekly: body `{ "frequency": "weekly" }`
- [ ] Monthly: body `{ "frequency": "monthly" }`
- [ ] Header `x-digest-cron-secret` set in all jobs.

Pre-production dry run:

- [ ] Execute `{ "frequency": "weekly", "dry_run": true }`
- [ ] Confirm non-zero recipients attempted in result (if subscriber base exists).

Production validation:

- [ ] One successful non-dry run captured in digest job table.
- [ ] One-click unsubscribe link works from delivered email.
- [ ] Webhook updates outbound delivery statuses.

---

## 6) SEO and domain setup

- [ ] `NEXT_PUBLIC_SITE_URL` matches production canonical domain.
- [ ] `robots.txt` reachable and correct.
- [ ] `sitemap.xml` reachable and includes article/category URLs.
- [ ] OG image path valid (`/og-image.png`).
- [ ] Optional: submit sitemap to search consoles.

Validation:

- [ ] Inspect source of home/article/category pages for canonical + JSON-LD.

---

## 7) Accessibility and UX launch gate

- [ ] Keyboard navigation from top nav to footer works.
- [ ] Skip link is visible on focus and moves focus to main content.
- [ ] Footer contrast validated in both themes (light/dark).
- [ ] Reduced motion (`prefers-reduced-motion`) tested for ticker/animations.
- [ ] Focus ring visible on key interactive elements.

---

## 8) Performance launch gate

- [ ] Verify ISR behavior on:
  - [ ] `/` (30s)
  - [ ] `/articles` (30s)
  - [ ] `/articles/[slug]` (60s)
  - [ ] `/category/[slug]` (60s)
- [ ] Check article/home LCP in staging (desktop + mobile).
- [ ] Review image-heavy pages for oversized assets.
- [ ] Confirm ad loading does not block first contentful render.

---

## 9) Backoffice/operator access and runbook links

- [ ] Editor accounts can manage announcements and see reader KPIs.
- [ ] Manager/Admin accounts can manage ads, homepage sections, subscribers, campaigns.
- [ ] Team has links to:
  - [ ] `docs/redesign/09-backoffice-operations.md`
  - [ ] `docs/redesign/10-subscriber-and-digest-runbook.md`
  - [ ] `docs/redesign/11-qa-report.md`
  - [ ] `docs/redesign/13-rollout-and-monitoring.md`

---

## 10) Final go-live checks

- [ ] `pnpm build` successful in CI/deployment pipeline.
- [ ] Health check endpoint monitored.
- [ ] Rollback target/version identified.
- [ ] Incident contact owner assigned for first rollout window.

When all mandatory boxes are checked, proceed with staged rollout.
