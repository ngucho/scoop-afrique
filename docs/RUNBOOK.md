# SCOOP AFRIQUE — Runbook

## Prerequisites

- Node.js 20+
- pnpm 9+
- Auth0 account (see `AUTH0_SETUP.md`)
- Supabase project (see `SUPABASE_SETUP.md`)

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd scoop-afrique-landing
pnpm install

# 2. Configure environment
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
# Fill in Auth0 and Supabase credentials

# 3. Run database migrations
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
# Or run SQL files manually in Supabase Dashboard > SQL Editor

# 4. Seed the database (optional)
# Run supabase/seed.sql in the SQL Editor

# 5. Start development
pnpm dev          # All apps in parallel
# OR
pnpm dev:backend  # Backend only (port 4000)
pnpm dev:frontend # Frontend only (port 3001)
pnpm dev:landing  # Landing only (port 3000)
```

## Environment Variables

### Backend (`apps/backend/.env`)

```bash
PORT=4000
NODE_ENV=development
CORS_ORIGINS="http://localhost:3001"
API_PREFIX="/api/v1"
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://api.scoop-afrique.com"
```

### Frontend (`apps/frontend/.env.local`)

```bash
AUTH0_SECRET="<generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_CLIENT_ID="<from Auth0>"
AUTH0_CLIENT_SECRET="<from Auth0>"
APP_BASE_URL="http://localhost:3001"
AUTH0_AUDIENCE="https://api.scoop-afrique.com"
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SITE_URL="http://localhost:3001"
```

## Database Management

### Run migrations

```bash
# Option A: Supabase CLI
npx supabase db push

# Option B: Manual (SQL Editor in Dashboard)
# Run files in supabase/migrations/ in order
```

### Seed data

```bash
# Run supabase/seed.sql in the SQL Editor
# Inserts 13 categories (Actualités, Politique, Économie, etc.)
```

### Create storage bucket

1. Supabase Dashboard > Storage > New bucket
2. Name: `images`, Public: Yes
3. Allowed MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`
4. Max size: 5 MB

## Build & Deploy

### Build all

```bash
pnpm build
```

### Deploy Frontend (Vercel)

1. Connect repo to Vercel
2. Set root directory: `apps/frontend`
3. Build command: `pnpm build`
4. Set all environment variables from `.env.local`
5. Enable Vercel Analytics and Speed Insights (auto-detected)

### Deploy Backend

Deploy to Railway, Render, or Fly.io:

1. Set root directory: `apps/backend`
2. Build: `pnpm build`
3. Start: `node dist/index.js`
4. Set all environment variables from `.env`

### Deploy Landing

1. Connect repo to Vercel (separate project)
2. Set root directory: `apps/landing`
3. Build command: `pnpm build`

## Troubleshooting

### Backend won't start
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` are set
- Run `pnpm --filter @scoop-afrique/backend build` to check TypeScript errors

### Auth0 login not working
- Check `AUTH0_SECRET` is generated (32+ random bytes)
- Check callback URLs in Auth0: `http://localhost:3001/auth/callback`
- Check logout URLs: `http://localhost:3001`
- Verify `AUTH0_AUDIENCE` matches the API identifier in Auth0

### Database errors
- Verify migrations have been run in order
- Check service role key has correct permissions
- Run `npx supabase db push` to sync migrations

### Frontend build fails
- Run `pnpm install` to ensure dependencies are up to date
- Check that `scoop` package builds: `cd packages/scoop && pnpm build`
- Verify `transpilePackages: ['scoop']` in `next.config.mjs`

## Admin redirects and troubleshooting

When the admin layout redirects to the **reader home** (`/`), it is usually because:

| Cause | Fix |
|-------|-----|
| No access token | Set **AUTH0_AUDIENCE** in frontend `.env.local`; ensure login requests an access token for your API. |
| Token has no permissions | In Auth0: enable RBAC and “Add Permissions in the Access Token”; assign roles with API permissions to the user. |
| Backend GET /auth/me fails | Backend running; correct **NEXT_PUBLIC_API_URL**; backend **AUTH0_DOMAIN** and **AUTH0_AUDIENCE** match the token; check CORS. |

Server actions that need the token will also redirect to `/` if `getAccessToken()` returns null (same session/token config). Other redirects: no session → `/admin/login`; role too low on some pages → `/admin`; profile onboarding → `/admin/profile?onboarding=1`. See **AUTH0_SETUP.md** §12 for /auth/me and 401 debugging.

## Monorepo Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps |
| `pnpm dev:backend` | Start backend |
| `pnpm dev:frontend` | Start frontend |
| `pnpm dev:landing` | Start landing |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm --filter @scoop-afrique/backend build` | Build backend only |
| `npx supabase db push` | Apply migrations |
