# SCOOP AFRIQUE — Complete Project Guide

This guide covers every aspect of the Scoop Afrique webapp: architecture, setup, service configuration (Supabase, Auth0, Twilio, Resend), migrations, environment variables, and troubleshooting.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Why Drizzle Migrations Fail (Troubleshooting)](#2-why-drizzle-migrations-fail-troubleshooting)
3. [Supabase Setup — Complete Tutorial](#3-supabase-setup--complete-tutorial)
4. [Auth0 Setup — Complete Tutorial](#4-auth0-setup--complete-tutorial)
5. [Twilio Setup — WhatsApp Notifications](#5-twilio-setup--whatsapp-notifications)
6. [Resend Setup — Email Notifications](#6-resend-setup--email-notifications)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Local Development](#8-local-development)
9. [Deployment](#9-deployment)
10. [Drizzle Migration Reference](#10-drizzle-migration-reference)

---

## 1. Project Overview

### Database & ORM

- **DATABASE_URL** — Single pooler connection string for all database access
- **Drizzle ORM** — Parameterized queries (SQL injection safe), no raw SQL
- **Supabase Storage** — Images and PDFs via `SUPABASE_SERVICE_ROLE_KEY` (URL derived from DATABASE_URL)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  VERCEL                                                             │
│  ┌─────────────┐  ┌─────────────────────────────────────────────┐  │
│  │  brands     │  │  frontend (Reader + Admin) + CRM             │  │
│  │  (Landing)  │  │  Port 3001 / 3002                            │  │
│  └─────────────┘  └──────────────────────┬──────────────────────┘  │
└─────────────────────────────────────────┼──────────────────────────┘
                                          │ Auth0 JWT
                                          ▼
                    ┌────────────────────────────────────────────┐
                    │  Backend API (Hono/Node) — Port 4000         │
                    │  REST /api/v1 — Auth0 JWT validation        │
                    └────────────────────┬───────────────────────┘
                                         │ Service Role
                    ┌────────────────────┴───────────────────────┐
                    │  Supabase (PostgreSQL + Storage)            │
                    │  Auth0 (sole IAM — no Supabase Auth)        │
                    │  Resend (email) + Twilio (WhatsApp)         │
                    └────────────────────────────────────────────┘
```

### Apps

| App | Stack | Purpose | Port |
|-----|-------|---------|------|
| **brands** | Next.js | Marketing landing / vitrine | 3000 |
| **frontend** | Next.js | Reader + Admin/Manager backoffice | 3001 |
| **crm** | Next.js | CRM (contacts, projects, devis, invoices) | 3002 |
| **backend** | Hono + Node.js | REST API | 4000 |

### Package

| Package | Description |
|---------|-------------|
| **scoop** | Design system (components, Atomic Design, Tailwind v4) |

---

## 2. Why Drizzle Migrations Fail (Troubleshooting)

Common reasons migrations fail and how to fix them:

### 2.1 DATABASE_URL Not Set

**Symptom:** "DATABASE_URL is required" or connection refused.

**Fix:** Set `DATABASE_URL` in `apps/backend/.env` (pooler URI from Supabase Connect dialog). The drizzle config loads it via `dotenv/config`.

### 2.2 Migrations Run in Wrong Order (relation does not exist)

**Symptom:** "relation does not exist" or "function set_updated_at does not exist".

**Fix:** Migrations run in order via `drizzle-kit migrate`. See [§10 Drizzle Migration Reference](#10-drizzle-migration-reference). Ensure `0000_initial_schema.sql` runs first.

### 2.3 Database Already Migrated with Supabase

**Symptom:** Running `pnpm db:migrate` fails with "relation already exists" or "type app_role already exists".

**Fix:** Your DB was set up with Supabase migrations. Run the bootstrap script once to mark all migrations as applied:

```bash
pnpm db:bootstrap
pnpm db:migrate   # Should report nothing to do
```

Then use `pnpm db:migrate` for future schema changes. For a fresh DB, run `pnpm db:migrate` directly (no bootstrap).

### 2.4 db:push Known Limitation

**Symptom:** `pnpm db:push` fails with `TypeError: Cannot read properties of undefined (reading 'replace')`.

**Cause:** `drizzle-kit push` introspects the DB and has a bug parsing certain CHECK constraints. Our schema uses CHECK constraints (e.g. `profiles`, `article_likes`, `crm_project_contacts`).

**Fix:** Use `pnpm db:migrate` for schema changes instead of `db:push`. Migrations are the source of truth. For prototyping on a fresh DB, run `pnpm db:migrate` first.

### 2.5 Recommended workflow

```bash
# From project root (or apps/backend)
pnpm db:migrate    # Apply pending migrations (primary workflow)
pnpm db:push       # Prototyping only — may fail on DBs with CHECK constraints
pnpm db:seed       # Seed default categories (optional)
pnpm db:studio     # Open Drizzle Studio
```

---

## 3. Supabase Setup — Complete Tutorial

### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up.
2. Click **New project**.
3. **Name:** `scoop-afrique` (or your choice).
4. **Database password:** Generate and **save securely** — you need it for migrations.
5. **Region:** Choose closest to your users (e.g. Frankfurt, Paris).
6. Wait for project creation.

### 3.2 Supabase credentials — where to find each variable

The backend uses **DATABASE_URL** (pooler) + **SUPABASE_SERVICE_ROLE_KEY** only. No SUPABASE_URL needed — it is derived from DATABASE_URL.

> **Easiest:** Click the **Connect** button (top of the project page) — it opens a dialog with the pooler URI and service role key.

| Variable | Where to find it | Used by |
|----------|------------------|---------|
| **DATABASE_URL** | **Connect** dialog → **PostgreSQL** → **URI** (pooler, e.g. `postgresql://postgres.REF:PASSWORD@...pooler.supabase.com:5432/postgres`) | Backend (Drizzle ORM + migrations) |
| **SUPABASE_SERVICE_ROLE_KEY** | **Settings** → **API Keys** → **Legacy API Keys** → **service_role** (Reveal) | Backend (Storage only) |

**Current dashboard structure:**

- **Connect** (button at top): Pooler URI, service_role key — [direct link](https://supabase.com/dashboard/project/_?showConnect=true)
- **Settings** → **API Keys**: service_role — [direct link](https://supabase.com/dashboard/project/_/settings/api-keys)

### 3.3 Run Migrations (Drizzle)

Migrations live in `apps/backend/drizzle/` and are applied via Drizzle Kit:

```bash
# From project root
pnpm db:migrate

# Or from apps/backend
cd apps/backend && pnpm db:migrate
```

Requires `DATABASE_URL` in `apps/backend/.env`. For prototyping, use `pnpm db:push` to sync schema without migration files.

### 3.4 Create Storage Bucket (Images)

1. Dashboard → **Storage** → **New bucket**.
2. **Name:** `images`
3. **Public:** Yes
4. **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`
5. **File size limit:** 5 MB

> Videos are never uploaded — only YouTube embed URLs on articles.

### 3.5 Seed Categories (Optional)

```bash
pnpm db:seed
```

Inserts default categories (Actualités, Politique, Économie, etc.). Safe to run multiple times.

### 3.6 Connect Backend

In `apps/backend/.env` (values from **Connect** dialog):

```bash
# Pooler URI (PostgreSQL tab) — includes password
DATABASE_URL=postgresql://postgres.XXXX:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

# Service role key (for Storage: images, PDFs)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 4. Auth0 Setup — Complete Tutorial

Auth0 is the **sole IAM** for Scoop Afrique. Supabase Auth is not used.

### 4.1 Create Auth0 Tenant

1. Go to [auth0.com/signup](https://auth0.com/signup).
2. Choose a **tenant name** (e.g. `scoop-afrique`). Domain: `scoop-afrique.auth0.com`.

### 4.2 Create Frontend Application (Regular Web)

1. **Applications** → **Applications** → **Create Application**.
2. **Name:** `Scoop Afrique Backoffice`
3. **Type:** **Regular Web Applications**
4. **Settings:**
   - **Allowed Callback URLs:** `http://localhost:3001/auth/callback`, `http://localhost:3002/auth/callback` (CRM), plus production URLs
   - **Allowed Logout URLs:** `http://localhost:3001`, `http://localhost:3002`, plus production
   - **Allowed Web Origins:** same as above
5. Note **Domain**, **Client ID**, **Client Secret**.

### 4.3 Create Backend API

1. **Applications** → **APIs** → **Create API**.
2. **Name:** `Scoop Afrique API`
3. **Identifier:** `https://api.scoop-afrique.com` (this is `AUTH0_AUDIENCE`)
4. **Signing Algorithm:** RS256
5. **Permissions** tab — add:

| Permission | Description |
|------------|-------------|
| `read:articles` | List/read articles |
| `create:articles` | Create drafts |
| `update:articles` | Update articles |
| `delete:articles` | Delete articles |
| `publish:articles` | Publish/schedule |
| `read:media`, `create:media`, `delete:media` | Media |
| `read:users`, `manage:users` | User management |
| `read:crm`, `write:crm`, `manage:crm` | CRM access |

6. **Settings** → **RBAC Settings:**
   - **Enable RBAC:** On
   - **Add Permissions in the Access Token:** On
7. **Application Access:** Authorize your Backoffice app to call this API.

### 4.4 Create Roles and Assign Permissions

1. **User Management** → **Roles** → Create:
   - `journalist` — read/create/update articles, read/create media
   - `editor` — journalist + publish, read/write CRM
   - `manager` — editor + delete articles, manage CRM
   - `admin` — all permissions
2. **User Management** → **Users** → Assign roles to each user.

### 4.5 Post-Login Action (user_metadata in tokens)

1. **Actions** → **Library** → **Build Custom**.
2. **Name:** `Add user_metadata to tokens`
3. **Trigger:** **Login / Post Login**
4. Paste code from `docs/auth0-actions/post-login-add-user-metadata.js`
5. **Deploy** → **Flows** → **Login** → add this Action.

### 4.6 M2M Application (Profile/Password Management)

For backend to update user metadata and password:

1. **Applications** → **Create Application** → **Machine to Machine**.
2. Select your API (or Auth0 Management API).
3. Grant `read:users`, `update:users`.
4. Note **Client ID** and **Client Secret** → `AUTH0_MANAGEMENT_CLIENT_ID`, `AUTH0_MANAGEMENT_CLIENT_SECRET`.

### 4.7 Environment Variables

See [§7 Environment Variables Reference](#7-environment-variables-reference).

---

## 5. Twilio Setup — WhatsApp Notifications

Twilio sends WhatsApp notifications when a **devis** (quote request) is submitted on the brands site. Optional — backend works without it.

### 5.1 Create Twilio Account

1. Go to [twilio.com](https://www.twilio.com) and sign up.
2. Verify your account (phone/email).

### 5.2 Enable WhatsApp Sandbox (Testing)

1. **Messaging** → **Try it out** → **Send a WhatsApp message**.
2. Join the sandbox by sending the code to the number shown.
3. Sandbox number format: `whatsapp:+14155238886` (example).

### 5.3 Get Credentials

1. **Account** → **API keys & tokens**.
2. Note **Account SID** and **Auth Token**.
3. **Messaging** → **Senders** → your WhatsApp number (or sandbox).

### 5.4 Configure Backend

In `apps/backend/.env`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # Your Twilio WhatsApp number
TWILIO_WHATSAPP_TO=+2250700000000            # Team number to receive notifications
```

### 5.5 Production (WhatsApp Business API)

For production, you need:
- Twilio WhatsApp Business API approval
- A verified business profile
- A dedicated WhatsApp number

See [Twilio WhatsApp docs](https://www.twilio.com/docs/whatsapp).

---

## 6. Resend Setup — Email Notifications

Resend sends emails when a **devis** is submitted (to team and prospect). Optional.

### 6.1 Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up.
2. Verify your domain (or use Resend's test domain for dev).

### 6.2 Get API Key

1. **API Keys** → **Create API Key**.
2. Copy the key (starts with `re_`).

### 6.3 Configure Backend

In `apps/backend/.env`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 6.4 Domain Verification (Production)

1. **Domains** → **Add Domain**.
2. Add the DNS records (SPF, DKIM) to your domain.
3. Use the verified domain in `RESEND_FROM_EMAIL`.

---

## 7. Environment Variables Reference

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (prod) | Pooler connection string (Supabase Connect → PostgreSQL → URI) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (prod) | Service role key for Storage (images, PDFs); URL derived from DATABASE_URL |
| `PORT` | No | Default 4000 |
| `NODE_ENV` | No | development / production |
| `CORS_ORIGINS` | No | Comma-separated origins (e.g. `http://localhost:3001,http://localhost:3002`) |
| `API_PREFIX` | No | Default `/api/v1` |
| `AUTH0_DOMAIN` | Yes (prod) | Tenant domain (e.g. `scoop-afrique.auth0.com`) |
| `AUTH0_AUDIENCE` | Yes (prod) | API identifier (e.g. `https://api.scoop-afrique.com`) |
| `AUTH0_MANAGEMENT_CLIENT_ID` | Optional | M2M app for profile/password |
| `AUTH0_MANAGEMENT_CLIENT_SECRET` | Optional | M2M secret |
| `RESEND_API_KEY` | Optional | Email for devis notifications |
| `RESEND_FROM_EMAIL` | Optional | Sender email |
| `TWILIO_ACCOUNT_SID` | Optional | WhatsApp notifications |
| `TWILIO_AUTH_TOKEN` | Optional | |
| `TWILIO_WHATSAPP_FROM` | Optional | e.g. `whatsapp:+1234567890` |
| `TWILIO_WHATSAPP_TO` | Optional | Team WhatsApp number |

### Frontend (`apps/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH0_SECRET` | Yes | 32+ random bytes: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH0_DOMAIN` | Yes | Tenant domain |
| `AUTH0_CLIENT_ID` | Yes | Backoffice app Client ID |
| `AUTH0_CLIENT_SECRET` | Yes | Backoffice app secret |
| `APP_BASE_URL` | Yes | `http://localhost:3001` |
| `AUTH0_AUDIENCE` | Yes | API identifier |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000` |
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3001` |

### CRM (`apps/crm/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH0_SECRET` | Yes | Same as frontend or new 32-byte secret |
| `AUTH0_DOMAIN` | Yes | Same tenant |
| `AUTH0_CLIENT_ID` | Yes | Can use same app (add callback `http://localhost:3002/auth/callback`) |
| `AUTH0_CLIENT_SECRET` | Yes | |
| `APP_BASE_URL` | Yes | `http://localhost:3002` |
| `AUTH0_AUDIENCE` | Yes | Same API |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000` |

---

## 8. Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Auth0 account
- Supabase project

### Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd scoop-afrique-webapp
pnpm install

# 2. Environment
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/crm/.env.example apps/crm/.env.local
# Fill in credentials

# 3. Migrations
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push

# 4. Seed (optional)
# Run supabase/seed.sql in Supabase SQL Editor

# 5. Start
pnpm dev
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | All apps in parallel |
| `pnpm dev:backend` | Backend only (4000) |
| `pnpm dev:frontend` | Frontend only (3001) |
| `pnpm dev:brands` | Brands only (3000) |
| `pnpm dev:crm` | CRM only (3002) |
| `pnpm build` | Build all |
| `pnpm lint` | Lint all |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:push` | Push schema (prototyping) |
| `pnpm db:seed` | Seed default categories |
| `pnpm db:studio` | Open Drizzle Studio |

---

## 9. Deployment

- **Frontend / Brands / CRM:** Vercel — connect repo, set Root Directory, add env vars.
- **Backend:** Vercel (Serverless), Railway, Render, or Fly.io — set `CORS_ORIGINS` with production URLs.

See `docs/DEPLOYMENT_VERCEL.md` for details.

---

## 10. Drizzle Migration Reference

Migrations live in `apps/backend/drizzle/` and run in order via `pnpm db:migrate`:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `0000_initial_schema.sql` | profiles, categories, articles, comments, newsletter, set_updated_at |
| 2 | `0001_storage_media.sql` | Storage policies |
| 3 | `0002_backend_v2.sql` | video_url, tags, view_count, media table, increment_view_count |
| 4 | `0003_profiles_personal_info.sql` | Profile personal fields |
| 5 | `0004_profiles_business_only.sql` | Business-only profile logic |
| 6 | `0005_article_system_v3.sql` | Article v3 (locks, collaborators, etc.) |
| 7 | `0006_article_author_display_name.sql` | Author display name |
| 8 | `0007_devis_requests.sql` | Devis requests table |
| 9 | `0008_crm_schema.sql` | CRM tables (contacts, projects, devis, invoices, etc.) |
| 10 | `0009_devis_requests_conversion.sql` | Conversion tracking on devis_requests |
| 11 | `0010_crm_services.sql` | CRM services catalog |
| 12 | `0011_project_contacts.sql` | Project-contacts junction |
| 13 | `0012_devis_project_id.sql` | project_id on devis |
| 14 | `0013_invoice_discount.sql` | Invoice discount field |
| 15–17 | `0015–0017` | CRM tables create-if-missing, devis project_id, discount_amount |
| 18 | `0018_devis_requests_project_id.sql` | converted_to_project_id on devis_requests (project-centric traceability) |

**New migrations:** Edit `apps/backend/src/db/schema.ts`, then run `pnpm db:generate --name=your_migration_name` to generate SQL.

---

## 11. CRM Project-Centric Workflow

The **project** is the central entity. All related data (devis, invoices, receipts/payments) is retrievable from the project folder.

### Data flow

```
devis_request → contact (optional)
devis_request → devis (optional)
devis (accepted) → project (devis_id, converted_to_project_id on devis_request)
project → invoices (project_id)
invoice → payments (receipts, receipt_pdf_url)
```

### Project folder API

`GET /api/v1/crm/projects/:id/folder` returns in one call:

- **project** — core project data
- **devis** — linked devis (from project.devis_id or project_id)
- **invoices** — with nested **payments** (receipts)
- **contacts** — project contacts
- **devis_request** — original request (if devis came from devis_request)
- **expenses** — project expenses

### Finance page

The project Finance tab (`/projects/:id/finance`) uses the folder endpoint and displays:

- Devis (with PDF link if generated)
- Invoices (with payment receipts)
- Expenses

---

## Related Documentation

| File | Content |
|------|---------|
| `AUTH0_SETUP.md` | Detailed Auth0 configuration |
| `SUPABASE_SETUP.md` | Supabase schema overview |
| `ARCHITECTURE.md` | System architecture |
| `RUNBOOK.md` | Quick runbook |
| `DEPLOYMENT_VERCEL.md` | Vercel deployment |
| `API.md` | API reference |
| `RBAC.md` | Roles and permissions |
