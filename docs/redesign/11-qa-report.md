# Redesign QA report

This report validates the redesigned platform across reader experience, admin operations, newsletter/digest, ad fallbacks, accessibility, performance, and SEO.

## 1) Scope and validation method

Validated scope:

- `apps/frontend` (reader + admin UI + account/newsletter flows)
- `apps/backend` (reader/admin routes, digest pipeline, ads/announcements)
- `packages/scoop` (design tokens/components used by reader UI)

Validation method used for this report:

1. Build and lint validation on the monorepo:
   - `pnpm build` ✅
   - `pnpm lint` ✅ (warnings only, no blocking errors)
2. Code-level audit of core routes/components/services.
3. Functional matrix review (implemented behavior + expected runtime checks).

Build evidence highlights:

- All apps build successfully (frontend, brands, crm, backend).
- Frontend build output confirms ISR/revalidate routes and sitemap/robots generation.
- No TypeScript build blocker remains in digest service.

Known non-blocking warnings:

- Missing Auth0 env vars in local build context (warnings only).
- Existing lint warnings (`no-img-element`, some hook/library warnings in CRM, unused vars).

---

## 2) Critical UI regression fixed (footer dark mode)

### Issue

Reader footer used hardcoded white text styles with theme-sensitive background tokens, causing contrast mismatch when theme/background switched.

### Fix applied

File updated: `apps/frontend/components/reader/ReaderFooter.tsx`

- Replaced hardcoded white palette with semantic tokens:
  - `bg-foreground` -> `bg-surface`
  - `text-white*` -> `text-foreground` / `text-muted-foreground`
  - `border-white/10` -> `border-border`
- Footer links now use semantic foreground hover styles.

### Expected result

- Light theme: dark text on light footer surface.
- Dark theme: light text on dark footer surface.
- No theme-specific hardcoded contrast regression.

---

## 3) End-to-end test matrix (reader, admin, newsletter, ads fallbacks)

Status legend:

- ✅ Pass (validated by build + implementation audit)
- ⚠️ Partial (implemented, requires live-env/manual runtime confirmation)
- ❌ Fail (not found / broken)

| Area | Scenario | Expected result | Status | Evidence |
|---|---|---|---|---|
| Reader shell | Load homepage with sidebar/chrome/footer | Sidebar + optional announcement/ticker + footer render | ✅ | `ReaderLayout`, `ReaderSidebar`, `ReaderChrome`, `ReaderFooter` |
| Reader home | Modular homepage sections | Featured/latest/trending/editors/category strips render from `buildHomeSections()` | ✅ | `app/page.tsx`, `lib/homeSections.ts` |
| Reader article | Rich article layout | Hero/media, structured metadata, context rail, related, ad placements | ✅ | `app/articles/[slug]/page.tsx` |
| Reader category | Category hub with metadata | Category header + featured + list + CAT_TOP slot + canonical/schema | ✅ | `app/category/[slug]/page.tsx` |
| Reader ads fallback | Slot has no creative | Placeholder/house fallback shows without breaking layout | ✅ | `AdSlotRenderer` fallback branch |
| Reader ad tracking | Impression/click events | Impression sent on intersection, click sent on outbound | ✅ | `AdSlotRenderer` `IntersectionObserver` + POST events |
| Newsletter subscribe | Public newsletter form | Submit to backend subscribe endpoint and show feedback | ✅ | `app/newsletter/NewsletterForm.tsx`, `actions.ts` |
| Reader account login | `/account/login` -> Auth0 reader login | Redirect/login entrypoint for reader account | ✅ | `app/account/login/page.tsx`, `/reader/auth/login` |
| Reader account protected | `/account` requires reader session | Unauthenticated users redirected to login | ✅ | `app/account/(protected)/layout.tsx` |
| Reader preferences | Update topics/frequency | PATCH `/api/reader/me` persists settings | ⚠️ | UI+proxy implemented; requires backend/env to verify live |
| Admin dashboard KPIs | Reader insights shown for eligible roles | Subscriber/CTR/top categories/articles available | ⚠️ | `app/admin/(protected)/page.tsx`, requires DB/event data |
| Admin announcements | Create/update/delete announcements | Mutations work and are audited | ⚠️ | UI + `/admin/reader/announcements` routes exist |
| Admin ads | Manage slots/campaigns/creatives | Campaign and creative CRUD available | ⚠️ | UI + `/admin/reader/ads/*` routes exist |
| Admin homepage modules | Update order/layout/visibility/config | Section edits persist with audit log | ⚠️ | `reader/homepage` editor + backend patch route |
| Admin subscribers | Filter + segment updates with reason | Segment changes stored and audited | ⚠️ | subscribers page + PATCH with `reason` |
| Admin newsletter campaigns | Create/update/delete campaign configs | Campaign CRUD works with cadence/filter scheduling | ⚠️ | newsletters page + backend mapping |
| Digest cron | Trigger digest run | Auth secret protected endpoint executes job | ⚠️ | `POST /api/v1/digest/run`, needs cron/env |
| Digest webhook | Resend webhook updates outbound status | Delivery/bounce/complaint updates persisted | ⚠️ | `/digest/webhooks/resend` route; requires webhook secret |
| One-click unsubscribe | Unsubscribe link in digest | Token endpoint unsubscribes + redirects to account | ⚠️ | `/digest/unsubscribe` route implemented |

---

## 4) Accessibility checks

## 4.1 Keyboard and focus

Checks:

- Skip link exists and targets `#main-content` in reader layout.
- Interactive controls are keyboard reachable (sidebar links, CTA buttons, account controls).
- Ad outbound link has explicit focus-visible ring.

Status: ✅ Pass (implemented)

Evidence:

- `ReaderLayout` skip link (`Aller au contenu principal`)
- `AdSlotRenderer` anchor uses `focus-visible:ring-2`

## 4.2 Contrast and theming

Checks:

- Footer uses semantic colors for both themes (fixed in this change).
- Reader shell relies on `background/foreground/muted` tokens from design system.

Status: ✅ Pass (with footer regression fixed)

## 4.3 Reduced motion

Checks:

- Ticker has marquee/static dual rendering and reduced-motion CSS fallback.
- Motion classes in design system disable animation under `prefers-reduced-motion`.

Status: ✅ Pass

Evidence:

- `ReaderChrome` uses `.reader-ticker-marquee` and `.reader-ticker-static-list`
- `lib/animations.css` and `packages/scoop/src/theme.css` reduced-motion media queries

## 4.4 A11y residual risks

- Several image usages still rely on `<img>` instead of `next/image` (performance + potential accessibility consistency risk).
- Full screen-reader pass (NVDA/VoiceOver) should be executed in staging before production cutover.

Status: ⚠️ Partial (manual assistive-tech pass still required)

---

## 5) Performance checks

## 5.1 Route-level caching and ISR strategy

Confirmed:

- Home: `revalidate = 30`
- Articles listing: `revalidate = 30`
- Category page: `revalidate = 60`
- Article page: `revalidate = 60`
- Sitemap fetches categories/articles with `revalidate = 3600`
- API client uses Next fetch `next: { revalidate }` where provided

Status: ✅ Pass

## 5.2 Ad and interaction performance

Confirmed:

- Ad impression loading is intersection-driven (`IntersectionObserver` + root margin), reducing above-the-fold work.
- Ad clicks/impressions sent asynchronously with `keepalive`.

Status: ✅ Pass

## 5.3 Image optimization

Finding:

- Some reader components still use native `<img>` (`ArticleCard`, `FeaturedHero`, ad creative image).
- This matches lint warnings and may affect LCP/bandwidth in high-traffic pages.

Status: ⚠️ Partial (functional, but optimization debt remains)

Recommendation:

- Migrate editorial images to `next/image` with explicit sizes and remote patterns.
- Keep ad creatives as `<img>` only where external dynamic URLs make optimization impractical.

---

## 6) SEO checks

## 6.1 Metadata/canonical/OG

Confirmed:

- Global metadata in root layout includes OG/Twitter defaults and canonical base.
- Home, articles list, category, and article detail set canonical URLs.
- Article pages include article-specific OG metadata and publication timestamps.

Status: ✅ Pass

## 6.2 Structured data (schema)

Confirmed:

- Home: `ItemList` JSON-LD
- Category: `CollectionPage` JSON-LD
- Article detail: `NewsArticle` JSON-LD

Status: ✅ Pass

## 6.3 Crawl assets

Confirmed:

- Dynamic `sitemap.xml` includes static pages, published articles, categories.
- `robots.txt` allows crawl and disallows `/admin/` and `/api/`.

Status: ✅ Pass

## 6.4 SEO residual risks

- No dedicated split sitemap index/news sitemap yet.
- No explicit hreflang strategy yet (single-locale acceptable for now).

Status: ⚠️ Partial (non-blocking for current launch scope)

---

## 7) Release readiness summary

Overall redesign readiness: **Go for staged rollout** with the conditions below.

Mandatory before production:

1. Set full Auth0 + backend env vars in deployment targets.
2. Enable digest cron secret and schedule jobs (daily/weekly/monthly).
3. Connect Resend webhook and verify delivery status ingestion.
4. Run manual accessibility pass on staging (keyboard + screen reader + dark/light contrast).

Recommended immediately after release:

1. Reduce `<img>` usage on reader-critical cards/hero for better LCP.
2. Add synthetic monitoring for homepage/article/account/admin routes.
3. Track ad fallback rate and CTR per slot in dashboard.
