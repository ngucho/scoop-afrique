# Services Layer

Business logic lives here. Routes call services; services call Supabase. Never access the DB directly from routes.

| Service                  | Responsibility                                          |
| ------------------------ | ------------------------------------------------------- |
| `profile.service.ts`     | Get-or-create Auth0 profiles, sync role from JWT        |
| `article.service.ts`     | CRUD articles, listing, search, view count              |
| `comment.service.ts`     | CRUD comments, moderation (approve/reject)              |
| `category.service.ts`    | CRUD categories                                         |
| `like.service.ts`        | Toggle likes (authenticated + anonymous), count         |
| `newsletter.service.ts`  | Subscribe, confirm, unsubscribe                         |
| `media.service.ts`       | Image upload (Supabase Storage), URL registration       |
| `auth.service.ts`        | Re-exports types (Auth0 handles auth, not the backend)  |

## Architecture Rules

1. **Auth0 is the sole IAM** — no login/logout/refresh on the backend
2. **Service role only** — backend uses Supabase service key, bypasses RLS
3. **Videos are never uploaded** — always YouTube embed URLs
4. **Images** — upload to Supabase Storage OR register external URL
5. **Comments are moderated** — created as `pending`, approved by editors+
