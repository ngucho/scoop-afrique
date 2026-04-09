# Ad and sponsor placement map

This document defines **named slots** for display advertising and **sponsor** surfaces so implementations can target containers consistently (e.g. GPT unit paths, direct sales, or house promos). It aligns with the IA in `01-information-architecture.md` and templates in `02-page-templates.md`.

---

## 1. Principles

- **One identifier per slot** — use these IDs in code, ad ops spreadsheets, and analytics.
- **Responsive first** — each slot declares **allowed formats** and **collapse rules** when empty.
- **Sponsor vs. IAB** — **Sponsor zones** (homepage block J, optional hero label) are **not** replacements for standard IAB placements; keep labels distinct for legal/trust.
- **Consent** — respect cookie/consent layer before loading third-party scripts (existing `CookieConsentBanner` flow).

---

## 2. Slot catalog

| ID | Page / context | Position (relative to content) | Primary formats | Collapse when empty |
|----|----------------|--------------------------------|-----------------|---------------------|
| `GLOBAL_TOP_BANNER` | All `ReaderLayout` pages | Below site chrome, above page title | 970×90 / 728×90 (desktop), 320×50 (mobile) | Yes — no reserved gap |
| `HOME_HERO_SPONSOR` | Home | Adjacent to or below hero headline (small label strip) | Text + logo lockup (custom) | Yes |
| `HOME_MID_1` | Home | Between “editors’ picks” (or trending) and category strips | 300×250 / fluid native | Yes |
| `HOME_BOTTOM` | Home | Above footer, below newsletter / sponsor logos | 728×90 / 970×90 | Yes |
| `HOME_SPONSOR_LOGOS` | Home | “Partenaires” row (often non-IAB logos) | Logo strip | Yes |
| `LIST_TOP` | `/articles` | Below category chips, above grid | 728×90 / 320×50 | Yes |
| `LIST_MID` | `/articles` | Between grid rows (even page only optional) | 300×250 | Yes |
| `CAT_TOP` | `/category/[slug]` | Below category header | 728×90 / 320×50 | Yes |
| `ARTICLE_TOP` | `/articles/[slug]` | Below category tags, optional above hero media | 300×250 (rail) or 728×90 | Yes |
| `ARTICLE_MID` | `/articles/[slug]` | Between body and footer actions or mid-body insert | 300×250 native | Yes — prefer after 3rd paragraph if in-body |
| `ARTICLE_RAIL` | `/articles/[slug]` | Sticky sidebar **desktop only** | 300×600 / 300×250 | Yes — column hidden if empty |
| `ARTICLE_BOTTOM` | `/articles/[slug]` | Below like/share footer, above related | 728×90 | Yes |
| `RELATED_BELOW` | Article | Below related articles block | 970×250 / responsive | Yes |
| `VIDEO_HUB_MID` | `/video` | Between hero and grid | 728×90 | Yes |
| `PODCAST_HUB_MID` | `/podcast` | Between hero and episodes | 728×90 | Yes |
| `NEWSLETTER_INLINE` | `/newsletter` | Optional below form | 300×250 house promo | Yes |

**Reserved for future use (document only):** `AUDIO_PREROLL` (podcast player), `VIDEO_PREROLL` (in-house player).

---

## 3. Responsive behavior by breakpoint

Assume Tailwind-like breakpoints: **sm** ≥640px, **md** ≥768px, **lg** ≥1024px.

### 3.1 `GLOBAL_TOP_BANNER`

| Breakpoint | Behavior |
|------------|----------|
| Below md | Single **mobile banner** width (100% max 320px centered); height ≤ 50px typical |
| ≥ md | Leaderboard **centered**; max width matches content grid (`max-w-6xl`) |

### 3.2 `HOME_MID_1`, `LIST_MID`, `CAT_TOP`, `ARTICLE_MID`

| Breakpoint | Behavior |
|------------|----------|
| Below sm | Full-bleed **with horizontal padding** matching page (`px-4`); MPU stacks |
| sm–md | MPU centered |
| ≥ lg | MPU may sit **inline** in two-column layouts if grid allows |

### 3.3 `ARTICLE_RAIL`

| Breakpoint | Behavior |
|------------|----------|
| Below lg | **Do not render** — no rail column on tablet/phone |
| ≥ lg | Fixed or sticky column **right of** article text column; must not overlap share buttons when scrolling |

### 3.4 `ARTICLE_TOP` (article)

| Breakpoint | Behavior |
|------------|----------|
| Below md | Prefer **in-feed** MPU after title block; avoid pushing hero image below excessive ad height |
| ≥ md | May use **horizontal** leaderboard **or** defer to `ARTICLE_RAIL` to limit vertical jumps |

---

## 4. Stacking and frequency caps

- **Global top banner:** Max **one** instance per page load (same ID).
- **Home:** Target order `GLOBAL_TOP_BANNER` → content → `HOME_MID_1` → … → `HOME_BOTTOM` — avoid more than **three** concurrent IAB-class units in the first **two** viewport heights on mobile.
- **Article:** Prefer **one** in-body unit (`ARTICLE_MID` **or** mid-native, not both) unless ad ops overrides.

---

## 5. Integration notes (implementation)

- Map each **ID** to a single DOM node with `data-ad-slot="{ID}"` for automation and E2E tests.
- Lazy-load slots **below the fold** (`intersection` or `requestIdleCallback`) to protect Core Web Vitals.
- House campaigns (newsletter signup, events) may **reuse the same IDs** with internal creatives when third-party inventory is empty — still respect **collapse** rules.

---

## 6. Accessibility

- Ads must have **aria-label** or title indicating “Publicité” / “Sponsor” per regional policy.
- No auto-playing video/audio in slots unless user gesture or muted with controls (prefer **no** autoplay in reader).

---

## 7. Acceptance checklist (ad product)

- [ ] Every **ID** in section 2 exists in the ad ops spreadsheet with line item mapping.
- [ ] Responsive rules tested at 375px, 768px, 1280px widths.
- [ ] Empty collapse verified — **no** layout shift loop when filling async.
- [ ] Article rail does not reduce body text width below readable measure (< ~60ch) on large screens.
