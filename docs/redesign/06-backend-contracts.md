# Backend API contracts — media operations

Base URL: `{API_PREFIX}` (default `/api/v1`). Responses use JSON. Public routes omit auth; admin routes require `Authorization: Bearer <Auth0 JWT>` and the noted role.

## Public

### Announcements

| Method | Path | Description |
|--------|------|-------------|
| GET | `/announcements` | Active announcements (within `starts_at` / `ends_at` if set, `is_active`). |

Response: `{ "data": Announcement[] }`

### Ads

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ads/placements` | Active ad slots and creatives grouped by slot for campaigns that are active and in date range. |
| POST | `/ads/events/impression` | Record an impression (`creative_id`, optional `session_id`, `article_id`, `user_agent`, `metadata`). |
| POST | `/ads/events/click` | Record a click (same body shape as impression). |

Response `GET /ads/placements`: `{ "data": { "slots": AdSlot[], "creatives_by_slot": { [slotId]: AdCreative[] } } }`

### Newsletter (unchanged)

Existing `/newsletter` subscribe / unsubscribe / confirm behavior is unchanged.

### Articles, categories, comments

Existing public article, category, and comment endpoints are unchanged.

---

## Admin (manager or admin)

All paths below require `manager` or `admin` role.

### Announcements CRUD

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/announcements` | List all announcements. |
| POST | `/admin/announcements` | Create (validated body: `title`, `body`, optional `placement`, `priority`, `link_url`, `is_active`, `starts_at`, `ends_at`). |
| GET | `/admin/announcements/:id` | Get one. |
| PATCH | `/admin/announcements/:id` | Partial update. |
| DELETE | `/admin/announcements/:id` | Delete. |

### Ad inventory & campaigns

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/ads/slots` | List slots. |
| POST | `/admin/ads/slots` | Create slot (`key`, `name`, …). |
| PATCH | `/admin/ads/slots/:id` | Update slot. |
| DELETE | `/admin/ads/slots/:id` | Delete slot. |
| GET | `/admin/ads/campaigns` | List campaigns. |
| POST | `/admin/ads/campaigns` | Create campaign. |
| PATCH | `/admin/ads/campaigns/:id` | Update campaign. |
| DELETE | `/admin/ads/campaigns/:id` | Delete campaign. |
| GET | `/admin/ads/creatives` | List creatives; optional `?campaign_id=`. |
| POST | `/admin/ads/creatives` | Create creative. |
| PATCH | `/admin/ads/creatives/:id` | Update creative. |
| DELETE | `/admin/ads/creatives/:id` | Delete creative. |

### Subscriber segments & profiles

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/subscribers/segments` | List segments. |
| POST | `/admin/subscribers/segments` | Create segment (`name`, optional `description`, `filter` JSON). |
| PATCH | `/admin/subscribers/segments/:id` | Update. |
| DELETE | `/admin/subscribers/segments/:id` | Delete. |
| GET | `/admin/subscribers/profiles` | List subscriber profiles with preferences when present. |
| POST | `/admin/subscribers/profiles` | Link a `profile_id` (staff/auth profile) to newsletter data (`newsletter_subscriber_id`, `display_name`). |
| GET | `/admin/subscribers/profiles/:id` | Get one. |
| PATCH | `/admin/subscribers/profiles/:id` | Update. |
| DELETE | `/admin/subscribers/profiles/:id` | Delete. |
| PUT | `/admin/subscribers/profiles/:id/preferences` | Upsert preferences (`frequency`: `daily` \| `weekly` \| `monthly`, `category_ids`: UUID[]). |

### Newsletter campaigns & digest jobs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/digest/campaigns` | List newsletter campaigns. |
| POST | `/admin/digest/campaigns` | Create campaign. |
| PATCH | `/admin/digest/campaigns/:id` | Update campaign. |
| DELETE | `/admin/digest/campaigns/:id` | Delete campaign. |
| GET | `/admin/digest/jobs` | List digest jobs (`?limit=`). |
| POST | `/admin/digest/enqueue` | Enqueue digest (`frequency`, optional `campaign_id`, `scheduled_for`, `send_now`). |

---

## Errors

- `400` — `VALIDATION_ERROR` with Zod `details` when the body fails validation.
- `401` / `403` — missing/invalid token or insufficient role.
- `404` — resource not found for id-based routes.

---

## Notes

- **Digest send pipeline**: `POST /admin/digest/enqueue` with `send_now: true` creates a completed job with a placeholder result until email delivery is integrated (Resend, worker, etc.).
- **Ad tracking**: Public impression/click endpoints accept anonymous payloads; rate limiting should be applied at the edge in production.
