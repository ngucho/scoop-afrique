# SCOOP AFRIQUE — Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌─────────────┐    ┌──────────────────────────────────────┐    │
│  │  Landing    │    │           Frontend                    │    │
│  │  (Next.js)  │    │  ┌─────────────┐ ┌────────────────┐  │    │
│  │  Static     │    │  │   Reader    │ │  Admin/Manager │  │    │
│  │  Vitrine    │    │  │   (public)  │ │  (protected)   │  │    │
│  └─────────────┘    │  └─────────────┘ └────────┬───────┘  │    │
│                      └──────────────────────────┼──────────┘    │
│                                                  │               │
│  Analytics + Speed Insights                      │               │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │ Auth0 JWT
                                                   ▼
                     ┌──────────────────────────────────────┐
                     │         Backend API (Hono/Node)      │
                     │         REST /api/v1                  │
                     │         Auth0 JWT validation          │
                     │         Profile sync                  │
                     └────────────┬─────────────────────────┘
                                  │ Service Role
                     ┌────────────┴─────────────────────────┐
                     │           Supabase                    │
                     │  ┌─────────────┐ ┌────────────────┐  │
                     │  │ PostgreSQL  │ │ Storage        │  │
                     │  │ (7 tables)  │ │ (images only)  │  │
                     │  └─────────────┘ └────────────────┘  │
                     └──────────────────────────────────────┘
                                  ▲
                     ┌────────────┴─────────────────────────┐
                     │            Auth0                      │
                     │   Identity + Roles + Permissions     │
                     │   (sole IAM — no Supabase Auth)      │
                     └──────────────────────────────────────┘
```

## Apps

| App | Stack | Purpose | Port |
|-----|-------|---------|------|
| **landing** | Next.js 16 | Marketing vitrine | 3000 |
| **frontend** | Next.js 16 | Reader + Admin/Manager | 3001 |
| **backend** | Hono + Node.js | REST API | 4000 |

## Package

| Package | Description |
|---------|-------------|
| **scoop** | Design system (45 components, Atomic Design, Tailwind v4) |

## Frontend Architecture

### Reader (Public)
- Server Components for data fetching
- Article pages, categories, search, newsletter
- Like button (client component)
- SEO metadata, Open Graph

### Admin/Manager (Protected)
- Auth0 session-based authentication
- Role-based navigation and page guards
- Tiptap block editor for article creation
- Dashboard with role-specific widgets
- Comment moderation, media library, category management

### Route Structure

```
/                     → Reader homepage
/articles             → Article listing
/articles/[slug]      → Article detail
/category/[slug]      → Category listing
/newsletter           → Newsletter signup
/search               → Search
/admin/login          → Admin login (Auth0)
/admin                → Dashboard (role-based)
/admin/articles       → Article management
/admin/articles/new   → New article (Tiptap editor)
/admin/articles/[id]/edit → Edit article
/admin/comments       → Comment moderation (editor+)
/admin/media          → Media library
/admin/categories     → Category CRUD (manager+)
/admin/team           → Team management (manager+)
/admin/users          → User management (admin)
/admin/profile        → Profile settings
/admin/settings       → System settings (admin)
```

## Backend Architecture

### Layer Structure

```
Routes → Middleware → Services → Supabase
```

### API Endpoints (28)

| Group | Count | Auth |
|-------|-------|------|
| Health | 1 | None |
| Auth | 1 | Required |
| Articles (public) | 4 | Optional |
| Comments (public) | 4 | Mixed |
| Categories (public) | 2 | None |
| Newsletter | 3 | None |
| Admin Articles | 6 | Required |
| Admin Comments | 3 | editor+ |
| Admin Categories | 4 | manager+ |
| Admin Media | 4 | journalist+ |

## Database Schema

| Table | Records | Key Relationships |
|-------|---------|-------------------|
| `profiles` | Auth0 users | auth0_id → Auth0 sub |
| `categories` | Article taxonomy | — |
| `articles` | Content | author_id → profiles, category_id → categories |
| `article_likes` | Engagement | article_id → articles, user_id → profiles |
| `comments` | Discussion | article_id → articles, user_id → profiles |
| `newsletter_subscribers` | Email list | — |
| `media` | Image registry | uploaded_by → profiles |

## IAM (Auth0)

- Login/logout via Auth0 SDK on frontend
- JWT validation on backend (JWKS)
- Permissions mapped to roles: journalist < editor < manager < admin
- Profile synced to DB on every authenticated request

## Media Strategy

| Type | Storage | Max Size |
|------|---------|----------|
| Images | Supabase Storage (`images` bucket) or external URL | 5 MB |
| Videos | Never uploaded — YouTube embed URLs only | — |

## Analytics

| Service | Purpose |
|---------|---------|
| Vercel Analytics | Page views (automatic) |
| Vercel Speed Insights | Core Web Vitals |
| Backend `view_count` | Per-article view counter |

## Security

- CORS with allowed origins
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Zod validation on all API inputs
- Auth0 JWT verification with JWKS
- Supabase RLS on all tables
- Service role key on backend only (never exposed)
- Comments moderated before public display

## Key Docs

| File | Content |
|------|---------|
| `API.md` | Full API endpoint reference |
| `RBAC.md` | Roles, permissions, mapping |
| `editorial-workflow.md` | Article lifecycle and workflow |
| `AUTH0_SETUP.md` | Auth0 tenant configuration |
| `SUPABASE_SETUP.md` | Database, migrations, storage |
| `RUNBOOK.md` | Run locally, migrate, deploy |
