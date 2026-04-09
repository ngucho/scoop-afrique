# Data model — media operations

PostgreSQL (Supabase). Migration: `apps/backend/drizzle/0027_media_operations.sql`. Drizzle definitions: `apps/backend/src/db/schema.ts`.

## Enums

| Enum | Values |
|------|--------|
| `announcement_placement` | `banner`, `modal`, `inline`, `footer` |
| `ad_campaign_status` | `draft`, `active`, `paused`, `ended` |
| `digest_frequency` | `daily`, `weekly`, `monthly` |
| `digest_job_status` | `pending`, `processing`, `sent`, `failed` |
| `newsletter_campaign_status` | `draft`, `scheduled`, `sending`, `sent`, `cancelled` |

## Tables

### `announcements`

Editorial or product messages shown on the site.

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `title`, `body` | text | Required |
| `placement` | `announcement_placement` | Default `banner` |
| `priority` | int | Higher sorts first |
| `link_url` | text | Optional CTA |
| `is_active` | boolean | |
| `starts_at`, `ends_at` | timestamptz | Optional window |
| `created_at`, `updated_at` | timestamptz | |

### `ad_slots`

Named inventory placements (e.g. `home-hero`, `article-inline`).

| Column | Type | Notes |
|--------|------|--------|
| `key` | text UNIQUE | Stable identifier for frontend |
| `name`, `description`, `format` | text | |
| `is_active`, `sort_order` | | |

### `ad_campaigns`

Buyer campaigns with schedule and status.

| Column | Type | Notes |
|--------|------|--------|
| `status` | `ad_campaign_status` | |
| `starts_at`, `ends_at` | timestamptz | Active window |
| `priority` | int | |
| `budget_cents` | int | Optional |
| `notes` | text | |

### `ad_creatives`

Creative assets bound to a campaign and slot.

| Column | Type | Notes |
|--------|------|--------|
| `campaign_id` | uuid FK → `ad_campaigns` ON DELETE CASCADE | |
| `slot_id` | uuid FK → `ad_slots` | |
| `image_url`, `link_url` | text | |
| `alt` | text | |
| `weight` | int | For rotation (default 1) |
| `is_active` | boolean | |

### `ad_impressions` / `ad_clicks`

Event rows for analytics (optional `article_id` FK to `articles`).

### `subscriber_profiles`

Links an internal `profiles` row (Auth0-backed staff or future linked identity) to newsletter subscription metadata.

| Column | Type | Notes |
|--------|------|--------|
| `profile_id` | uuid UNIQUE FK → `profiles` | |
| `newsletter_subscriber_id` | uuid UNIQUE FK → `newsletter_subscribers` | Optional |
| `display_name` | text | |

### `subscriber_preferences`

One row per profile: digest frequency and category filters.

| Column | Type | Notes |
|--------|------|--------|
| `subscriber_profile_id` | uuid UNIQUE FK → `subscriber_profiles` | |
| `frequency` | `digest_frequency` | Default `weekly` |
| `category_ids` | uuid[] | Category UUIDs |

### `subscriber_segments`

Named audience segments for campaigns; `filter` is JSON (e.g. tags, categories) for the sender to interpret.

### `newsletter_campaigns`

Scheduled or sent broadcast/digest campaigns.

| Column | Type | Notes |
|--------|------|--------|
| `segment_id` | uuid FK → `subscriber_segments` | Optional |
| `frequency` | `digest_frequency` | |
| `status` | `newsletter_campaign_status` | |
| `scheduled_at`, `sent_at` | timestamptz | |
| `subject`, `template_key` | text | |
| `stats` | jsonb | Aggregates / metadata |

### `digest_jobs`

Work queue for digest generation and delivery.

| Column | Type | Notes |
|--------|------|--------|
| `campaign_id` | uuid FK → `newsletter_campaigns` | Optional |
| `frequency` | `digest_frequency` | |
| `status` | `digest_job_status` | |
| `scheduled_for` | timestamptz | |
| `started_at`, `completed_at` | timestamptz | |
| `result` | jsonb | Payload or summary |
| `error` | text | |

## Relationships (summary)

```
profiles ──< subscriber_profiles >── newsletter_subscribers
                 │
                 └── subscriber_preferences

subscriber_segments <── newsletter_campaigns >── digest_jobs

ad_campaigns ──< ad_creatives >── ad_slots
ad_creatives ──< ad_impressions
ad_creatives ──< ad_clicks
```

## Compatibility

Existing tables (`articles`, `categories`, `comments`, `newsletter_subscribers`, etc.) are unchanged by this migration; new tables are additive.
