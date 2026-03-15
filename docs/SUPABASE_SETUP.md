# Supabase — Setup Guide for Scoop Afrique

> **Full guide:** See [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) for complete tutorials, migration troubleshooting, and all services (Auth0, Twilio, Resend).

This guide walks you through creating a Supabase project, setting up the database, and connecting it to the backend.

---

## 1. What is Supabase?

**Supabase** is a backend-as-a-service built on **PostgreSQL**. For this project it provides:

| Feature              | Use in Scoop Afrique                                                |
| -------------------- | ------------------------------------------------------------------- |
| **Database**         | Articles, categories, comments, likes, profiles, newsletter, media  |
| **Storage**          | Image uploads (bucket: `images`, max 5 MB). Videos are NOT stored.  |

> **Auth0 is the sole IAM.** Supabase Auth is not used. The backend connects with the **service role key** only.

---

## 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up.
2. Click **New project**.
3. **Name:** `scoop-afrique`
4. **Database password:** Save it securely.
5. **Region:** Closest to your users (e.g. Frankfurt, Paris).
6. Wait for project creation.

### Get your keys

In **Project Settings > API**:

- **Project URL** — e.g. `https://xxxx.supabase.co` → `SUPABASE_URL`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

(You do NOT need the anon key — Auth0 handles auth.)

---

## 3. Run Migrations

Migrations are managed by **Drizzle Kit** and live in `apps/backend/drizzle/`:

```bash
pnpm db:migrate
```

Requires `DATABASE_URL` in `apps/backend/.env` (pooler URI from Supabase Connect dialog). See [PROJECT_GUIDE.md §10](./PROJECT_GUIDE.md#10-drizzle-migration-reference) for the full migration list.

---

## 4. Create the Storage Bucket (Images)

1. In Dashboard > **Storage** > **New bucket**
2. **Name:** `images`
3. **Public:** Yes
4. **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`
5. **File size limit:** 5 MB

> Videos are **never uploaded**. They are always YouTube embed URLs stored on articles.

---

## 5. Seed the Database

Optional — pre-fills categories:

```bash
pnpm db:seed
```

Categories: Actualites, Politique, Economie, Societe, Culture, Sport, Opinions, Dossiers, Videos, Sante, Environnement, Technologie, Genre.

---

## 6. Connect the Backend

In `apps/backend/.env`:

```bash
# Database (pooler URI from Supabase Connect dialog)
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@...pooler.supabase.com:5432/postgres

# Storage (service role key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Auth0 (sole IAM)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.scoop-afrique.com
```

Start the backend: `pnpm dev:backend`

Verify: `GET http://localhost:4000/api/v1/articles` should return `{ "data": [], "total": 0 }`.

---

## 7. Schema Overview

| Table                    | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `profiles`               | Auth0 users (synced from JWT: auth0_id, role, name)  |
| `categories`             | Article taxonomy (name, slug, description)           |
| `articles`               | Articles with video_url, tags, view_count, SEO       |
| `article_likes`          | One like per user or anonymous per article            |
| `comments`               | Threaded, moderated (pending → approved/rejected)    |
| `newsletter_subscribers` | Email subscriptions with confirmation flow            |
| `media`                  | Image registry (Storage uploads + external URLs)     |

### Key Columns Added in V2

| Table      | Column        | Type      | Description                          |
| ---------- | ------------- | --------- | ------------------------------------ |
| articles   | `video_url`   | TEXT      | YouTube embed URL (no upload)        |
| articles   | `tags`        | TEXT[]    | Free-form tags array                 |
| articles   | `view_count`  | BIGINT    | Page views (atomic increment RPC)    |
| articles   | `scheduled_at`| TIMESTAMPTZ | Future publish date                |
| comments   | `user_id`     | UUID      | Renamed from author_id               |

### RPC Functions

| Function              | Description                        |
| --------------------- | ---------------------------------- |
| `increment_view_count`| Atomic view counter (+1 per call)  |

---

## 8. Auth0 and Profiles

**Auth0 is the only IAM.** The backend:

1. Validates Auth0 JWTs (via JWKS)
2. Maps permissions to roles (journalist, editor, manager, admin)
3. Get-or-creates a profile by `auth0_id = sub`
4. Syncs role, display_name, avatar_url from JWT to profiles table
5. Uses `profiles.id` (UUID) as `author_id` for articles and `user_id` for comments

Authorization is always from the Auth0 token — never from `profiles.role`.

---

## 9. Quick Checklist

- [ ] Create Supabase project and note DATABASE_URL + service_role key
- [ ] Run `pnpm db:migrate` to apply migrations
- [ ] Create `images` storage bucket (public, 5 MB, image MIME types)
- [ ] Run `seed.sql` to insert categories
- [ ] Set env vars in `apps/backend/.env`
- [ ] Start backend and verify `GET /api/v1/articles`
- [ ] Configure Auth0 (see `AUTH0_SETUP.md`)

---

## 10. Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
