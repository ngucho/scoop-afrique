# Information architecture — Scoop.Afrique reader

This document defines the **target** media information architecture for the reader experience in `apps/frontend`, grounded in an audit of **current** routes and layout patterns. It complements implementation work in `02-page-templates.md` and monetization in `03-ad-placement-map.md`.

---

## 1. Audit snapshot (current state)

### 1.1 Reader routes (Next.js App Router)

| Route | Role |
|-------|------|
| `/` | Home: featured hero + grid of remaining articles from a single feed (`limit=13`) |
| `/articles` | Article index: category chips, paginated grid (`limit=12`), optional `q` |
| `/articles/[slug]` | Article detail: cover image or video, body, share/like, related articles |
| `/category/[slug]` | Category hub: hero + grid (`limit=13`), link to `/articles?category=` if more |
| `/video` | Marketing / VOD landing (static placeholders + YouTube CTA) |
| `/podcast` | Marketing / audio landing (placeholders) |
| `/search` | Search entry (form submits to `/articles?q=`) |
| `/newsletter` | Dedicated signup |
| `/contact`, `/a-propos`, `/mentions-legales`, `/politique-de-confidentialite` | Institutional |

**Global chrome:** `ReaderLayout` wraps reader pages with a **fixed sidebar** (categories from API + content-type links + search) and **footer** (nav, sample categories, social, legal). On small viewports, a **top bar** (`h-14`) holds logo and menu; main content is offset with `pt-14`.

### 1.2 Gaps vs. a full media homepage

The current home does **not** yet expose distinct editorial modules (trending, editors’ picks, multiple category strips) or dedicated announcement surfaces beyond page content. The IA below specifies where those belong **without** assuming backend features exist today.

---

## 2. Site map (target reader IA)

```
/                          Home (editorial modules + discovery)
/articles                  All articles (filters, search results)
/articles/[slug]           Article
/category/[slug]          Category hub
/video                     Video hub (VOD / YouTube bridge)
/podcast                   Podcast hub
/search                    Search landing
/newsletter                Newsletter
/contact | /a-propos | …   Institutional
```

**Canonical rule:** “Actualités” in navigation resolves to `/articles` (today’s pattern for `actualites` slug). Other categories resolve to `/category/{slug}`.

---

## 3. Global navigation model

- **Primary (persistent):** Brand home, category list (dynamic from API, with fallback seeds in `READER_CATEGORIES`), content types (Articles, Vidéos, Podcast), Search.
- **Secondary:** Footer clusters — navigation shortcuts, highlighted categories, institutional links, social.
- **Cross-links:** “Retour au site vitrine” (external brands site) remains a **tertiary** escape hatch, not part of core reading IA.

---

## 4. Homepage block map (wireframe level)

Vertical order is **recommended**; some blocks may collapse when empty (see acceptance criteria in `02-page-templates.md`).

```
┌─────────────────────────────────────────────────────────────────┐
│ GLOBAL: optional TOP_ANNOUNCEMENT_BAR (full width, below chrome)   │
├─────────────────────────────────────────────────────────────────┤
│ GLOBAL: optional TICKER (single line, may hide on smallest widths) │
├─────────────────────────────────────────────────────────────────┤
│ [A] HERO — primary editorial feature (1 lead story)                │
│     Optional: sponsor label zone (see ad map)                      │
├─────────────────────────────────────────────────────────────────┤
│ [B] LATEST — “À la une” / derniers publiés (horizontal or grid)    │
├─────────────────────────────────────────────────────────────────┤
│ [C] TRENDING — “Les plus lus” (ranked list or compact cards)      │
├─────────────────────────────────────────────────────────────────┤
│ [D] EDITORS_PICKS — curated set (2–4 items, distinct from latest)  │
├─────────────────────────────────────────────────────────────────┤
│ [E] AD: HOME_MID_1 (between major sections)                        │
├─────────────────────────────────────────────────────────────────┤
│ [F] CATEGORY_STRIPS — repeatable block per priority category      │
│     Strip = section title + 3–5 cards + “Voir la rubrique →”       │
│     (Rotate or pin categories editorially.)                        │
├─────────────────────────────────────────────────────────────────┤
│ [G] INLINE_ANNOUNCEMENT_CARD — éditorial or produit (optional)    │
├─────────────────────────────────────────────────────────────────┤
│ [H] NEWSLETTER_CTA — headline + value prop + CTA → /newsletter    │
├─────────────────────────────────────────────────────────────────┤
│ [I] AD: HOME_FOOTER_RAIL or HOME_BOTTOM_BANNER                     │
├─────────────────────────────────────────────────────────────────┤
│ [J] SPONSOR_ZONES — “Partenaires” / logos (static or CMS-driven)   │
└─────────────────────────────────────────────────────────────────┘
```

### Block purposes

| Block | Purpose |
|-------|---------|
| **Hero** | Single highest-impact story; sets tone for the day |
| **Latest** | Time-ordered freshness for return visitors |
| **Trending** | Engagement-driven discovery (requires metrics in product) |
| **Editors’ picks** | Explicit curation; must not duplicate Hero lead |
| **Category strips** | Depth per vertical without leaving home |
| **Newsletter CTA** | Conversion; pairs with `/newsletter` |
| **Sponsor zones** | Brand visibility; distinct from IAB display slots where possible |

---

## 5. Category hub templates (conceptual)

Two templates cover all `/category/[slug]` pages:

### 5.1 Template **CAT_STANDARD**

For text-forward rubrics (politique, économie, culture, etc.).

```
Header: label + H1 + short descriptor
Optional: TOP_ANNOUNCEMENT_BAR / TICKER (inherited from global)
Featured hero (1 article) — optional if editorial rules say so
Section: article grid + pagination / “voir plus”
Optional: RELATED_STRIP (other categories or dossiers)
Optional: NEWSLETTER_CTA (compact)
Footer ads per global map
```

### 5.2 Template **CAT_MULTIMEDIA**

For `/video` and `/podcast` as **hubs** (not only marketing landings): hero for brand promise, then **episodes or playlists** as first-class rows. Today `/video` and `/podcast` are mostly static; this template describes the **target** when catalog data exists.

---

## 6. Article page templates (conceptual)

### 6.1 Template **ARTICLE_STANDARD** (`/articles/[slug]`)

```
Back link + category tags
Cover image OR inline video (if no image)
Title + lead + meta (date, reading time, author)
Share row (top)
Body
Optional: inline video after body when both image + video exist
Share + like (bottom)
Related articles
Optional: INLINE_ANNOUNCEMENT_CARD mid-body (see placements)
```

### 6.2 Template **ARTICLE_OPINION** (future variant)

Same shell as standard; optional **author box** more prominent and **disclaimer** line if policy requires.

### 6.3 Template **ARTICLE_DOSSIER** (future)

Long-form or series: **in-article navigation** (TOC), **sibling links** within dossier.

---

## 7. Announcement placements

| Placement | Location | Behavior |
|-----------|----------|----------|
| **Top bar** | Full width, directly under global header (or above on desktop if sticky stack is defined) | One short message + optional link; dismissible per session or until expiry |
| **Ticker** | Below top bar or below hero on home only | Horizontal crawl or pause-on-hover; truncate with “Lire plus” |
| **Inline cards** | Between homepage sections; mid-article after N paragraphs; above related on article | Card with title, short text, CTA; distinct visual from editorial cards |

**Priority:** If both top bar and ticker are active, cap total height so **first editorial module** remains visible above the fold on common laptop viewports.

---

## 8. Responsive principles (global)

- **Mobile:** Single column; category strips become horizontal scroll or stacked cards; ticker may become a **single-line rotating message** or hide in favor of top bar only.
- **Tablet:** Two columns where grids allow; hero may remain full width with smaller ratio.
- **Desktop:** Max content width aligned with today (`max-w-6xl` list pages, `max-w-3xl` article column); optional **rail** for ads on article (see ad map).

---

## 9. SEO and URL consistency

- Canonical article URLs: `/articles/{slug}`.
- Category URLs: `/category/{slug}`; listing with filters: `/articles?category={slug}`.
- Pagination: `?page=`; search: `?q=` — preserve parameters in pagination controls.

---

## 10. Dependencies (product / API)

Delivering the full IA requires, over time:

- Editorial signals: **featured**, **editors’ pick**, **trending** (or analytics integration).
- **Announcement** model: schedule, placement, dismiss rules.
- **Ad** configuration: slot enablement per breakpoint (see `03-ad-placement-map.md`).

This document is the **blueprint**; partial rollout (e.g. home blocks with static order) is valid if acceptance criteria per page are met for shipped scope.
