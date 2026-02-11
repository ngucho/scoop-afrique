# SCOOP AFRIQUE — API Reference v1

> **Base URL:** `{API_BASE}/api/v1` (e.g. `http://localhost:4000/api/v1`)
>
> **Auth:** Auth0 JWT Bearer token. Login/logout/refresh handled client-side by Auth0 SDK.
>
> **Response format:** JSON. Success: `{ data: T }` or `{ data: T[], total?: number }`. Error: `{ error: string, code?: string, details?: object }`.

---

## Health Check

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET    | `/`  | None |

**Response:**

```json
{
  "status": "ok",
  "service": "@scoop-afrique/backend",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-02-08T12:00:00.000Z"
}
```

---

## Auth

Auth0 is the **sole IAM**. There are no login/logout/refresh endpoints on the backend. The frontend uses the Auth0 SDK for authentication. The backend only validates JWTs and manages profile sync.

| Method | Path       | Auth     | Description                                      |
| ------ | ---------- | -------- | ------------------------------------------------ |
| GET    | `/auth/me` | Required | Validate token, get-or-create profile, return it |

### GET /auth/me

**Headers:** `Authorization: Bearer <auth0_access_token>`

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "auth0_id": "auth0|abc123",
    "email": "user@example.com",
    "role": "journalist",
    "display_name": "John Doe",
    "avatar_url": "https://..."
  }
}
```

**Response (401):** `{ "error": "Unauthorized" }`

---

## Articles (Public)

| Method | Path                  | Auth     | Description                              |
| ------ | --------------------- | -------- | ---------------------------------------- |
| GET    | `/articles`           | Optional | List published articles                  |
| GET    | `/articles/:id`       | Optional | Get article by UUID or slug              |
| GET    | `/articles/:id/likes` | Optional | Get like count and liked state           |
| POST   | `/articles/:id/likes` | Optional | Toggle like (authenticated or anonymous) |

### GET /articles

**Query parameters:**

| Param      | Type   | Default | Description                |
| ---------- | ------ | ------- | -------------------------- |
| `category` | string | —       | Filter by category slug    |
| `q`        | string | —       | Search title and excerpt   |
| `tag`      | string | —       | Filter by tag              |
| `page`     | number | 1       | Page number                |
| `limit`    | number | 20      | Items per page (max 100)   |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "article-title",
      "title": "Article Title",
      "excerpt": "...",
      "cover_image_url": "https://...",
      "video_url": "https://youtube.com/...",
      "content": [],
      "category_id": "uuid",
      "author_id": "uuid",
      "tags": ["politique", "afrique"],
      "status": "published",
      "published_at": "2026-02-08T12:00:00Z",
      "view_count": 42,
      "author": { "display_name": "John Doe", "avatar_url": "..." },
      "category": { "id": "uuid", "name": "Politique", "slug": "politique" }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### GET /articles/:id

**Params:** `:id` can be a UUID or a slug.

Returns the article with author and category data. Authenticated users can also access non-published articles. Increments `view_count` for published articles.

### GET /articles/:id/likes

**Query:** `anonymous_id` (optional) — to check if anonymous user liked.

**Response:** `{ "data": { "count": 5, "liked": false } }`

### POST /articles/:id/likes

**Body (optional):** `{ "anonymous_id": "unique-id" }`

**Response:** `{ "data": { "count": 6, "liked": true } }`

---

## Comments (Public)

| Method | Path                               | Auth     | Description              |
| ------ | ---------------------------------- | -------- | ------------------------ |
| GET    | `/articles/:articleId/comments`    | None     | List approved comments   |
| POST   | `/articles/:articleId/comments`    | Required | Create comment (pending) |
| PATCH  | `/comments/:id`                    | Required | Edit own comment         |
| DELETE | `/comments/:id`                    | Required | Delete own comment       |

### GET /articles/:articleId/comments

**Query:** `page`, `limit` (max 100).

**Response:** `{ "data": [...], "total": 15 }`

### POST /articles/:articleId/comments

**Body:**

```json
{
  "body": "Great article!",
  "parent_id": null
}
```

Comments are created with status `pending`. They appear after moderation (approval by editor+).

### PATCH /comments/:id

**Body:** `{ "body": "Updated text" }`

Editing a comment resets its status to `pending` for re-moderation.

### DELETE /comments/:id

Admins/managers can delete any comment. Regular users can only delete their own.

---

## Categories (Public)

| Method | Path                    | Auth | Description           |
| ------ | ----------------------- | ---- | --------------------- |
| GET    | `/categories`           | None | List all categories   |
| GET    | `/categories/:idOrSlug` | None | Get category by ID/slug |

---

## Newsletter

| Method | Path                     | Auth | Description             |
| ------ | ------------------------ | ---- | ----------------------- |
| POST   | `/newsletter/subscribe`  | None | Subscribe (email)       |
| POST   | `/newsletter/unsubscribe`| None | Unsubscribe             |
| GET    | `/newsletter/confirm`    | None | Confirm subscription    |

### POST /newsletter/subscribe

**Body:** `{ "email": "user@example.com" }`

**Response:** `{ "data": { "success": true, "message": "Inscription enregistrée." } }`

### POST /newsletter/unsubscribe

**Body:** `{ "token": "..." }` or `{ "email": "user@example.com" }`

### GET /newsletter/confirm?token=...

Confirms the subscription via the token sent by email.

---

## Admin — Articles

> All admin routes require Auth0 JWT authentication.

| Method | Path                         | Roles                           | Description           |
| ------ | ---------------------------- | ------------------------------- | --------------------- |
| GET    | `/admin/articles`            | Any authenticated               | List all articles     |
| GET    | `/admin/articles/:id`        | Any authenticated               | Get article (any status) |
| POST   | `/admin/articles`            | journalist, editor, manager, admin | Create article      |
| PATCH  | `/admin/articles/:id`        | Author or editor+               | Update article        |
| POST   | `/admin/articles/:id/publish`| editor, manager, admin          | Publish shortcut      |
| DELETE | `/admin/articles/:id`        | manager, admin                  | Delete article        |

### POST /admin/articles

**Body:**

```json
{
  "title": "Mon article",
  "slug": "mon-article",
  "excerpt": "Résumé court...",
  "category_id": "uuid",
  "content": [],
  "cover_image_url": "https://...",
  "video_url": "https://youtube.com/watch?v=...",
  "tags": ["politique", "afrique-de-l-ouest"],
  "status": "draft",
  "meta_title": "SEO Title",
  "meta_description": "SEO description",
  "og_image_url": "https://...",
  "scheduled_at": "2026-03-01T08:00:00Z"
}
```

- `slug` auto-generated from title if omitted.
- `video_url` must be a YouTube URL (no upload, always embedded).
- `cover_image_url` can be a Supabase Storage URL or external URL.
- `status`: `draft` → `review` → `published` (or `scheduled` for future dates).
- Publishing sets `published_at` automatically.

### POST /admin/articles/:id/publish

Shortcut to set status to `published`. Editor+ only.

### Role restrictions

| Role       | Can create | Can edit own | Can edit any | Can publish | Can delete |
| ---------- | ---------- | ------------ | ------------ | ----------- | ---------- |
| journalist | Yes        | Yes          | No           | No          | No         |
| editor     | Yes        | Yes          | Yes          | Yes         | No         |
| manager    | Yes        | Yes          | Yes          | Yes         | Yes        |
| admin      | Yes        | Yes          | Yes          | Yes         | Yes        |

---

## Admin — Comments (Moderation)

> Requires: editor, manager, or admin role.

| Method | Path                  | Description        |
| ------ | --------------------- | ------------------ |
| GET    | `/admin/comments`     | List all comments  |
| PATCH  | `/admin/comments/:id` | Moderate comment   |
| DELETE | `/admin/comments/:id` | Delete comment     |

### GET /admin/comments

**Query:** `status` (pending/approved/rejected), `page`, `limit`.

### PATCH /admin/comments/:id

**Body:** `{ "status": "approved" }` or `{ "status": "rejected" }`

---

## Admin — Categories

> Requires: manager or admin role.

| Method | Path                     | Description       |
| ------ | ------------------------ | ----------------- |
| GET    | `/admin/categories`      | List categories   |
| POST   | `/admin/categories`      | Create category   |
| PATCH  | `/admin/categories/:id`  | Update category   |
| DELETE | `/admin/categories/:id`  | Delete category   |

### POST /admin/categories

**Body:**

```json
{
  "name": "Technologie",
  "slug": "technologie",
  "description": "Articles sur la tech en Afrique"
}
```

---

## Admin — Media (Images)

> Requires: journalist, editor, manager, or admin role.
> **Videos are NEVER uploaded** — only YouTube URLs, stored directly on articles.

| Method | Path                  | Description             |
| ------ | --------------------- | ----------------------- |
| POST   | `/admin/media/upload` | Upload image file       |
| POST   | `/admin/media/url`    | Register external URL   |
| GET    | `/admin/media`        | List all media          |
| DELETE | `/admin/media/:id`    | Delete media + storage  |

### POST /admin/media/upload

**Content-Type:** `multipart/form-data`

| Field     | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `file`    | File   | Yes      | Image file (JPEG, PNG, WebP, GIF, AVIF) |
| `alt`     | string | No       | Alt text for accessibility           |
| `caption` | string | No       | Caption text                         |

**Limits:** Max 5 MB. Allowed: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`.

**Response (201):**

```json
{
  "data": {
    "id": "uuid",
    "url": "https://....supabase.co/storage/v1/object/public/images/...",
    "storage_path": "1707400000-abc12345.jpg",
    "alt": "Description",
    "caption": "Photo credit: ...",
    "uploaded_by": "uuid",
    "created_at": "2026-02-08T12:00:00Z"
  }
}
```

### POST /admin/media/url

For images already hosted elsewhere (no upload needed, referenced when articles load).

**Body:**

```json
{
  "url": "https://images.unsplash.com/...",
  "alt": "Description",
  "caption": "Credit: Unsplash"
}
```

### GET /admin/media

**Query:** `page`, `limit` (max 100).

---

## Types Summary

### Article

| Field             | Type     | Description                                |
| ----------------- | -------- | ------------------------------------------ |
| id                | UUID     | Primary key                                |
| slug              | string   | URL-friendly identifier                    |
| title             | string   | Article title                              |
| excerpt           | string?  | Short summary                              |
| cover_image_url   | string?  | Cover image (Storage or external URL)      |
| video_url         | string?  | YouTube embed URL                          |
| content           | JSONB    | Rich-text editor blocks                    |
| category_id       | UUID?    | FK to categories                           |
| author_id         | UUID     | FK to profiles                             |
| tags              | string[] | Free-form tags                             |
| status            | enum     | draft, review, scheduled, published        |
| published_at      | datetime?| Set on first publish                       |
| scheduled_at      | datetime?| Future publish date                        |
| view_count        | number   | Page views                                 |
| meta_title        | string?  | SEO title                                  |
| meta_description  | string?  | SEO description                            |
| og_image_url      | string?  | Open Graph image                           |
| created_at        | datetime | Creation timestamp                         |
| updated_at        | datetime | Last update timestamp                      |

### Profile (User)

| Field        | Type   | Description                        |
| ------------ | ------ | ---------------------------------- |
| id           | UUID   | Primary key (used as FK)           |
| auth0_id     | string | Auth0 sub (unique)                 |
| role         | enum   | journalist, editor, manager, admin |
| display_name | string?| Display name                       |
| avatar_url   | string?| Avatar URL                         |

### Comment

| Field      | Type     | Description                        |
| ---------- | -------- | ---------------------------------- |
| id         | UUID     | Primary key                        |
| article_id | UUID     | FK to articles                     |
| user_id    | UUID?    | FK to profiles                     |
| parent_id  | UUID?    | FK to comments (for replies)       |
| body       | string   | Comment text                       |
| status     | enum     | pending, approved, rejected        |
| created_at | datetime | Creation timestamp                 |
| updated_at | datetime | Last update timestamp              |

### Category

| Field       | Type    | Description         |
| ----------- | ------- | ------------------- |
| id          | UUID    | Primary key         |
| name        | string  | Display name        |
| slug        | string  | URL-friendly slug   |
| description | string? | Description         |
| sort_order  | number  | Display order       |

### Media

| Field        | Type    | Description                            |
| ------------ | ------- | -------------------------------------- |
| id           | UUID    | Primary key                            |
| url          | string  | Public URL                             |
| storage_path | string? | Supabase Storage path (null if external) |
| alt          | string? | Alt text                               |
| caption      | string? | Caption                                |
| uploaded_by  | UUID    | FK to profiles                         |
| created_at   | datetime| Upload timestamp                       |

---

## Error Codes

| HTTP | Code              | Meaning                              |
| ---- | ----------------- | ------------------------------------ |
| 400  | VALIDATION_ERROR  | Request body failed Zod validation   |
| 401  | —                 | Missing or invalid Auth0 JWT         |
| 403  | —                 | Insufficient role/permissions        |
| 404  | —                 | Resource not found                   |
| 500  | —                 | Internal server error                |

---

## Environment Variables

| Variable                   | Required    | Description                              |
| -------------------------- | ----------- | ---------------------------------------- |
| `PORT`                     | No (4000)   | Server port                              |
| `NODE_ENV`                 | No (dev)    | development, production, test            |
| `CORS_ORIGINS`             | No          | Comma-separated allowed origins          |
| `API_PREFIX`               | No (/api/v1)| API route prefix                         |
| `SUPABASE_URL`             | Prod: Yes   | Supabase project URL                     |
| `SUPABASE_SERVICE_ROLE_KEY`| Prod: Yes   | Supabase service role key                |
| `AUTH0_DOMAIN`             | Prod: Yes   | Auth0 tenant domain                      |
| `AUTH0_AUDIENCE`           | Prod: Yes   | Auth0 API audience identifier            |
