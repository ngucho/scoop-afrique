# Page templates — wireframe specs and acceptance criteria

Wireframes are **ASCII block diagrams** for structure only (no visual design). Paths refer to `apps/frontend` unless noted.

---

## Global layout: `ReaderLayout`

**Applies to:** All reader pages using `ReaderLayout`.

### Wireframe

```
┌──────────────┬────────────────────────────────────────────┐
│   SIDEBAR    │  MAIN (max width varies by template)         │
│   (fixed)    │                                              │
│   Logo       │  ┌────────────────────────────────────────┐ │
│   Categories │  │            PAGE CONTENT                 │ │
│   Types      │  │                                         │ │
│   Search     │  └────────────────────────────────────────┘ │
│   utilities  │              FOOTER (full width)             │
└──────────────┴────────────────────────────────────────────┘

Mobile: TOP BAR (h~56px) + hamburger; sidebar = overlay drawer
```

### Acceptance criteria — global

- **G1.** One **skip link** or logical focus order reaches main content without traversing every sidebar link (accessibility baseline).
- **G2.** Sidebar reflects **API categories** when available; fallback list matches editorial intent (`READER_CATEGORIES`).
- **G3.** Active route is visually indicated for category and content-type links.
- **G4.** Footer exposes navigation, categories, institutional links, and social targets without broken internal links.

---

## TPL-HOME — Home (`/`)

### Purpose

Primary editorial showcase: hero, discovery rows, conversion (newsletter), optional monetization.

### Wireframe

```
[Optional GLOBAL: TOP_ANNOUNCEMENT_BAR]
[Optional GLOBAL: TICKER]

┌──────────────────────────────────────────────┐
│ SECTION: Intro (label + H1 + dek)            │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ HERO — 1 featured story (large visual + meta) │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ LATEST — N cards (suggested N: 4–8)           │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ TRENDING — list or compact cards             │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ EDITORS_PICKS — 2–4 items                    │
└──────────────────────────────────────────────┘
[AD: HOME_MID_1]
┌──────────────────────────────────────────────┐
│ CATEGORY_STRIP × k (e.g. 3 strips)           │
└──────────────────────────────────────────────┘
[Optional INLINE_ANNOUNCEMENT_CARD]
┌──────────────────────────────────────────────┐
│ NEWSLETTER_CTA                               │
└──────────────────────────────────────────────┘
[AD: HOME_BOTTOM or SPONSOR block]
┌──────────────────────────────────────────────┐
│ SPONSOR_ZONES (logos / partner messaging)    │
└──────────────────────────────────────────────┘
[CTA: Voir tous les articles → /articles]
```

### Acceptance criteria — home

- **H1.** When **≥1** article exists, hero shows the **primary** featured item; remaining modules pull from non-conflicting pools (hero lead excluded from Latest if product rules require).
- **H2.** When **0** articles, empty state offers newsletter + external vitrine CTA (consistent with current empty pattern).
- **H3.** Each **Category strip** has a heading, at least one card, and a link to `/category/{slug}` or `/articles` for “actualités”.
- **H4.** **Newsletter CTA** is present once above the fold on desktop **or** immediately after first scroll section on mobile (pick one rule in implementation and keep consistent).
- **H5.** Trending block is **hidden** or shows fallback copy if metrics unavailable (no broken widgets).

---

## TPL-ARTICLE-INDEX — Article listing (`/articles`)

### Purpose

Filterable, paginated archive; also search results surface via `q`.

### Wireframe

```
┌──────────────────────────────────────────────┐
│ Header: H1 + short description               │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ CATEGORY_CHIPS (horizontal scroll on mobile)│
└──────────────────────────────────────────────┘
[Optional AD: LIST_TOP]
┌──────────────────────────────────────────────┐
│ GRID of ArticleCard (2–3 cols responsive)     │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ PAGINATION (prev / page indicator / next)    │
└──────────────────────────────────────────────┘
```

### Acceptance criteria — article index

- **A1.** Chips reflect **all** reader categories plus “Tous”; active state matches `category` query.
- **A2.** Pagination preserves `category` and `q` query parameters.
- **A3.** Empty state explains **no results** and offers reset to `/articles` or home.
- **A4.** Metadata title/description reflect filtered context where implemented.

---

## TPL-ARTICLE-DETAIL — Article (`/articles/[slug]`)

### Purpose

Read long-form content; share; discover related pieces.

### Wireframe

```
┌──────────────────────────────────────────────┐
│ ← Retour aux articles                         │
│ [Category tags]                               │
└──────────────────────────────────────────────┘
[Optional AD: ARTICLE_TOP]
┌──────────────────────────────────────────────┐
│ COVER: image OR embed (if no image)           │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ H1 + lead                                     │
│ Meta (date, duration, author) | Share        │
└──────────────────────────────────────────────┘
[Optional INLINE_ANNOUNCEMENT_CARD — mid body]
┌──────────────────────────────────────────────┐
│ ARTICLE BODY (prose)                          │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Optional video at end (image + video case)    │
└──────────────────────────────────────────────┘
[Optional AD: ARTICLE_MID]
┌──────────────────────────────────────────────┐
│ FOOTER: Share | Like                          │
└──────────────────────────────────────────────┘
[Optional AD: ARTICLE_BOTTOM]
┌──────────────────────────────────────────────┐
│ RELATED ARTICLES (wider container)            │
└──────────────────────────────────────────────┘
```

### Acceptance criteria — article detail

- **D1.** **404** for unknown slug (`notFound()`).
- **D2.** JSON-LD `Article` present with headline, dates, author, publisher.
- **D3.** OG/Twitter images use absolute URLs; fallback when no image per policy.
- **D4.** Cover video vs. body video rules preserved: video hero only when no image; video at end when both exist.
- **D5.** Related articles exclude current slug and render in a **wider** column than body when layout uses `max-w-6xl` for discovery.

---

## TPL-CATEGORY — Category hub (`/category/[slug]`)

### Purpose

Thematic aggregation with optional hero.

### Wireframe

```
┌──────────────────────────────────────────────┐
│ Label + H1 + descriptor                       │
└──────────────────────────────────────────────┘
[Optional AD: CAT_TOP]
┌──────────────────────────────────────────────┐
│ FEATURED HERO (first of list) — optional      │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ GRID of remaining articles                    │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ If total > page size: CTA → /articles?cat…   │
└──────────────────────────────────────────────┘
```

### Acceptance criteria — category

- **C1.** **404** for unknown category slug.
- **C2.** Canonical URL `/category/{slug}` in metadata.
- **C3.** “Voir plus” appears only when `total` exceeds on-page limit.
- **C4.** Empty category shows message + link to `/articles`.

---

## TPL-VIDEO-HUB — Video (`/video`)

### Purpose

Brand destination for video; bridge to YouTube until full VOD.

### Wireframe

```
┌──────────────────────────────────────────────┐
│ HERO: brand promise + primary CTA (YouTube)   │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ SECTION: featured videos / playlists (grid)   │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ STATUS / roadmap messaging                    │
└──────────────────────────────────────────────┘
```

### Acceptance criteria — video

- **V1.** Primary outbound CTA to official channel opens in **new tab** with `rel` attributes.
- **V2.** Placeholder cards do not claim playable video when URL empty (clear empty state inside card).
- **V3.** Page remains usable with **zero** configured YouTube URLs.

---

## TPL-PODCAST-HUB — Podcast (`/podcast`)

### Purpose

Audio brand surface; contact path for partnerships.

### Wireframe

```
┌──────────────────────────────────────────────┐
│ HERO: title + positioning                     │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Episode list (placeholders or future RSS)     │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Roadmap / contact                             │
└──────────────────────────────────────────────┘
```

### Acceptance criteria — podcast

- **P1.** “Bientôt” episodes are clearly **non-playable** (no fake player).
- **P2.** Mailto link includes subject for podcast inquiries.

---

## TPL-SEARCH — Search (`/search`)

### Purpose

Entry to keyword search (delegates results to `/articles?q=`).

### Wireframe

```
┌──────────────────────────────────────────────┐
│ H1 + helper text                              │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ FORM → submit to /articles?q=                 │
└──────────────────────────────────────────────┘
│ Secondary links: /articles, /                 │
```

### Acceptance criteria — search

- **S1.** Submitting with empty query navigates to `/articles` (current behavior).
- **S2.** Form is keyboard-submittable and labeled.

---

## TPL-NEWSLETTER — Newsletter (`/newsletter`)

### Purpose

Dedicated conversion page.

### Wireframe

```
┌──────────────────────────────────────────────┐
│ H1 + value proposition                        │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ FORM inside card                              │
└──────────────────────────────────────────────┘
```

### Acceptance criteria — newsletter

- **N1.** Success and error states do not trap focus (accessibility).
- **N2.** Page is reachable from footer and from home CTA when present.

---

## Institutional pages

**Routes:** `/contact`, `/a-propos`, `/mentions-legales`, `/politique-de-confidentialite`

### Acceptance criteria — institutional

- **I1.** Each page has unique `h1` and meta description.
- **I2.** Legal pages linked from footer on every reader page.

---

## Cross-template acceptance (announcements)

- **X1.** At most **one** of top bar or ticker uses **urgent** styling at a time (avoid alarm fatigue).
- **X2.** Inline announcement cards are labeled (e.g. “Info”) when not editorial content.
