# Reader frontend implementation

This document describes how the redesigned reader experience is implemented in `apps/frontend`, aligned with `02-page-templates.md`, `03-ad-placement-map.md`, `05-motion-guidelines.md`, and `06-backend-contracts.md`.

## Modular homepage

The home route (`app/page.tsx`) no longer hard-codes a single list. It calls `buildHomeSections()` in `lib/homeSections.ts`, which:

- Fetches a **pool** of recent articles (`GET /articles?limit=24&page=1`) and categories (`GET /categories`).
- Derives sections: **featured** (first in pool), **latest**, **trending** (by `view_count`), **editors’ picks**, and **category strips** (first six `READER_CATEGORIES` that exist in the API, two cards each without duplicating IDs used elsewhere in the pool).

When the pool is empty, the previous empty state (newsletter + brands CTA) is preserved.

## Announcement bar and breaking ticker

`ReaderLayout` loads `GET /announcements` via `lib/readerAnnouncements.ts`. The highest-priority **banner** item (or the top item if none) is shown in `ReaderChrome` using `AnnouncementBar` from `scoop`. Remaining items feed the `Ticker`, with **no duplicate** of the bar headline.

- **X1 (urgent styling):** If the bar announcement has `priority >= 10`, the bar uses the `signal` variant; the ticker stays visually secondary.
- **Reduced motion:** `lib/animations.css` defines `.reader-ticker-marquee` / `.reader-ticker-static-list` so the marquee hides and a static list shows when `prefers-reduced-motion: reduce`.

## Ad slot renderer

- **Server wrapper:** `components/reader/AdSlotSection.tsx` passes props to the client `AdSlotRenderer`.
- **Client:** `components/reader/AdSlotRenderer.tsx` renders `data-ad-slot="{key}"`, uses `AdSlotFrame` with label **Publicité**, and:
  - Shows a **placeholder** when no creative exists (no third-party script).
  - Uses `IntersectionObserver` before firing `POST /api/v1/ads/events/impression`; clicks call `POST .../click` with `creative_id` and optional `article_id`.

Placements are loaded with `fetchAdPlacements()` (`GET /ads/placements`). Slot keys are centralized in `lib/readerAds.ts` (`HOME_MID_1`, `ARTICLE_RAIL`, etc.).

## Category hubs

`app/category/[slug]/page.tsx` adds breadcrumbs, optional category **description** from the API, `CollectionPage` JSON-LD, optional `CAT_TOP` ad, featured hero, grid of remaining articles, and “Voir plus” when `total > LIMIT` (unchanged routing to `/articles?category=`).

## Article page

- **Layout:** Two columns on `lg+`: main column (max readable width) + **sticky** `StickyRail` with contextual links (`ArticleContextRail`) and optional `ARTICLE_RAIL` ad. Rail is omitted below `lg` per placement map.
- **Inline ads:** `ARTICLE_TOP` after tags; `ARTICLE_MID` splits the body after the third paragraph when content is splittable (`lib/tiptapSplit.ts` + `ArticleContentBlocks`). Optional **inline** announcement (`placement === 'inline'`) renders as `InlineAnnouncementCard` (“Info” label).
- **Footer:** `ARTICLE_BOTTOM` after like/share; `RELATED_BELOW` after the related block.

## Motion and interaction

- Prefer `MotionEnter` and `scoop-motion-hover-depth` over ad-hoc keyframes where added.
- Existing `animations.css` utilities remain; reduced-motion rules extended for the ticker.

## SEO and anti-scraping posture

- **Discoverability:** Per-article `NewsArticle` JSON-LD (`headline`, `url`, `image`, dates, `publisher`, `isAccessibleForFree`). Home adds `ItemList` for the main teaser list. Category hubs add `CollectionPage`.
- **Canonical URLs** and OG/Twitter metadata are preserved or tightened on the article page (`modifiedTime`, explicit `robots` index/follow).
- **Sitemap:** unchanged (`app/sitemap.ts` lists article URLs for crawlers).
- **Scraping:** Full article body remains HTML/JSON in the page response (required for SEO and readers). Mitigations are **policy and product** (copyright notice in the rail, no plain full-text API for anonymous bulk export in this app). Rate limiting and edge rules belong in infrastructure (see `06-backend-contracts.md`).

## Verification

- Run `pnpm --filter @scoop-afrique/frontend run build` after `pnpm --filter @scoop-afrique/api-logger run build` if needed.
- Lighthouse: run against production build locally or in CI; focus on LCP (images lazy below fold, ad slots lazy-tracked) and accessibility (skip link, ad labels, landmark structure).
