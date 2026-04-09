# Backoffice operations — reader platform

This document describes how the admin app controls the reader-facing product after the redesign: data model, API surface, role boundaries, and audit expectations.

## Scope

The backoffice adds five operational areas:

1. **Announcements** — time-bound or evergreen messages with audience targeting (all visitors, newsletter subscribers only, or guests only).
2. **Advertising** — predefined **slots**, weighted **campaigns**, and **creatives** (headline, link, optional image/body). Events (`impression` / `click`) feed CTR on the dashboard when the reader records them.
3. **Homepage sections** — ordered blocks with layout (`featured_grid`, `list`, `carousel`) and JSON **config** (e.g. `max_items`, tag filters).
4. **Subscribers** — list with filters (status, segment tag, email search). **Segment tags** are string arrays on each subscriber; updates require a **reason** and are written to the audit log.
5. **Newsletter campaigns** — templates with **cadence** (`daily` | `weekly` | `monthly`), **segment_filter** JSON, subject template, and optional **send_at**. Sending is a separate delivery concern; this UI owns configuration and audit.

Supporting tables: **`admin_audit_log`** stores actor, entity, action, optional reason, metadata, and timestamp.

## Database

Migration: `apps/backend/drizzle/0027_reader_platform_admin.sql`

- New columns on `newsletter_subscribers`: `segment_tags` (text[]), `signup_source` (text, optional).
- Seed rows for default ad slots and homepage sections (idempotent `ON CONFLICT (key) DO NOTHING`).

Apply with your usual Drizzle / Supabase workflow (`pnpm db:migrate` or equivalent in your environment).

## API (Hono)

Mounted at **`/api/v1/admin/reader`** (prefix from `config.apiPrefix`).

| Area | Method | Path | Roles |
|------|--------|------|--------|
| KPIs | GET | `/kpis` | editor, manager, admin |
| Announcements | GET/POST | `/announcements` | editor+ |
| Announcements | PATCH/DELETE | `/announcements/:id` | editor+ |
| Ad slots | GET | `/ads/slots` | manager, admin |
| Ad campaigns | GET/POST | `/ads/campaigns` | manager, admin |
| Ad campaigns | PATCH/DELETE | `/ads/campaigns/:id` | manager, admin |
| Creatives | POST | `/ads/campaigns/:id/creatives` | manager, admin |
| Creatives | DELETE | `/ads/campaigns/:campaignId/creatives/:creativeId` | manager, admin |
| Homepage | GET | `/homepage-sections` | manager, admin |
| Homepage | PATCH | `/homepage-sections/:id` | manager, admin |
| Subscribers | GET | `/subscribers` | manager, admin |
| Subscribers | PATCH | `/subscribers/:id` (segments + reason) | manager, admin |
| Newsletter campaigns | CRUD | `/newsletter-campaigns` | manager, admin |

Implementation: `apps/backend/src/routes/admin/reader-platform.ts`  
Service layer: `apps/backend/src/services/reader-platform.service.ts`

## RBAC alignment

Roles match the existing hierarchy (`journalist` < `editor` < `manager` < `admin`):

| Capability | Minimum role |
|------------|----------------|
| View reader KPIs on dashboard (subscribers, CTR, top categories/articles) | **Editor** |
| Manage announcements | **Editor** |
| Ads, homepage CMS, subscriber segments, newsletter campaign builder | **Manager** |
| Auth0 user admin (unchanged) | **Admin** |

Frontend navigation mirrors this (`lib/admin/rbac.ts` — `ADMIN_NAV` + helpers `canViewReaderInsights`, `canManageReaderOperations`, `canEditAnnouncements`).

## Audit-friendly UX

- Destructive or sensitive actions should stay **explicit** (confirm for deletes where implemented).
- Subscriber segment edits **require a reason**; the API persists it on `admin_audit_log`.
- Announcement, ad, homepage, and newsletter mutations append audit rows with actor id and metadata.

## Frontend modules

Routes under `apps/frontend/app/admin/(protected)/reader/`:

- `announcements/` — list + create + toggle/delete
- `ads/` — slots reference, campaign CRUD, creatives
- `homepage/` — per-section editor (title, layout, order, visibility, JSON config)
- `subscribers/` — filtered table + segment editor with reason
- `newsletters/` — campaign builder table + create form

Dashboard (`/admin`) pulls **`fetchReaderKpis()`** for editors and above when the API returns data.

## Operational notes

- **CTR** depends on the reader app recording `ad_events` (impressions/clicks). Until events exist, CTR tables show placeholders.
- **Newsletter send** is not implemented in this slice; campaigns are configuration + audit only until connected to your mail worker.
- Ensure **`DATABASE_URL`** is set on the backend so admin routes return 200 instead of 503 for DB-backed resources.
