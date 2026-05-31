---
name: Scoop Afrique
colors:
  surface: '#f9f9f9'
  surface-dim: '#e8e8e8'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2dfde'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5f5e5e'
  outline: '#e9bcb5'
  outline-variant: '#e2dfde'
  primary: '#b70100'
  on-primary: '#ffffff'
  primary-container: '#e60000'
  on-primary-container: '#ffffff'
  secondary: '#e2dfde'
  on-secondary: '#1a1c1c'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca730'
  signal: '#8a1a00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  muted: '#eeeeee'
  muted-foreground: '#5f5e5e'
  card: '#ffffff'
  border: '#e9e0de'
typography:
  display-hero:
    fontFamily: Newsreader
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '-0.01em'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: '0'
  body-base:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: '0'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  label-caps:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.3em
  logo-wordmark:
    fontFamily: Brasika
    fontSize: 20px
    fontWeight: '900'
    lineHeight: 20px
    letterSpacing: -0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 0.75rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
  '2xl': 1.5rem
  full: 9999px
  button: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  '2xl': 48px
  '3xl': 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  section-mobile: 48px
  section-desktop: 80px
---

# Design System: Scoop Afrique

## 1. Visual Theme & Atmosphere

Scoop Afrique is an editorial-grade pan-African media brand built for the digital-native generation. The visual language fuses the authority of classic print journalism — generous whitespace, serif display type, clear typographic hierarchy — with the energy and directness of contemporary African digital culture. The interface communicates confidence without formality, ambition without pretension. Every surface is clean and purposeful; colour is used as a signal, not decoration.

The palette is rooted in off-white warmth (`#f9f9f9`) that gives the reading environment a printed-paper quality without feeling dated. The singular Scoop Red (`#b70100`) functions as the editorial accent — appearing on category labels, active states, breaking news indicators, and primary calls to action — creating visual anchors that guide the reader's eye through dense article feeds. Dark mode flips to near-black backgrounds while preserving the same chromatic logic. The overall density is moderate: generous spacing between article cards, tight typographic rhythm within article bodies, and a clear separation between editorial content and navigational chrome.

## 2. Color Palette & Roles

### Primary Foundation
- **Off-White Paper** `#f9f9f9` — Primary page background; the "paper" of the publication. Used on body, card backgrounds, and reading columns.
- **True White** `#ffffff` — Card surfaces, modal backgrounds, input fields, hover states on nav.
- **Light Gray Surface** `#f3f3f3` — Muted sections, sidebar backgrounds, footer.
- **Medium Gray** `#eeeeee` — Muted UI elements, dividers, skeleton loaders.
- **Warm Gray Border** `#e9e0de` — Card borders, section dividers. Slightly warm (rosy undertone) to complement the red primary.

### Accent & Interactive
- **Scoop Red** `#b70100` — THE brand primary. Used for category pills, section headers, link hover, active nav indicators, CTA button fills, reading progress bars.
- **Signal Red** `#e60000` / `oklch(0.44 0.19 28)` — Breaking news badges, urgent alerts, live indicators. More saturated than primary.
- **Editorial Gold** `#735c00` / container `#cca730` — Tertiary accent for highlights, special editions, featured callouts. Adds warmth and prestige.

### Typography & Text Hierarchy
- **Near Black** `#1a1c1c` — Primary body text. Slightly warm black to match paper warmth.
- **Medium Gray Text** `#5f5e5e` — Secondary text: dates, bylines, captions, meta information.
- **Muted Text** `oklch(0.45 0 0)` — Placeholder text, disabled states, fine print.

### Functional States
- **Success Green** `oklch(0.55 0.18 145)` — Published confirmations, form success.
- **Error/Destructive** `oklch(0.55 0.22 25)` — Form errors, destructive actions.
- **Warning** `oklch(0.75 0.18 85)` — Caution states, expiry warnings.
- **Dark Mode Background** `oklch(0.07 0 0)` — Near-black, warm-neutral. Cards shift to `oklch(0.11 0 0)`.

## 3. Typography Rules

### Hierarchy & Weights

The system uses two complementary typefaces in deliberate editorial contrast:

**Newsreader** (Display / Headlines) — A contemporary revival of the traditional editorial serif. Used exclusively for article titles, section headlines, hero text, and pull quotes. It carries the authority of journalism while reading beautifully at large sizes. Weights used: 600 (headline) and 700 (display/hero). Never used for UI chrome or body text.

**Manrope** (Body / UI) — A rounded geometric sans-serif with excellent legibility at small sizes. Used for body copy, navigation, captions, labels, buttons, and all UI chrome. Weights range from 400 (body) through 700 (bold labels) to 800–900 (overlines and stamps).

**Brasika** (Logo Wordmark only) — Custom display font for the "SCOOP•AFRIQUE" logo mark. Never used for anything else.

Type scale follows an 8pt grid:
- **Hero headline**: 56px / -0.03em tracking / Newsreader 700 — Homepage leading article
- **XL headline**: 40px / -0.02em / Newsreader 700 — Section heroes, article H1
- **LG headline**: 30px / -0.02em / Newsreader 700 — Article card titles, H2
- **MD headline**: 24px / -0.01em / Newsreader 600 — Sidebar titles, card headlines
- **SM headline**: 18px / -0.01em / Newsreader 600 — Small card titles, H3
- **Body LG**: 18px / Manrope 400 — Article body lead paragraph
- **Body Base**: 16px / Manrope 400 — Article body, descriptions
- **Body SM**: 14px / Manrope 400 — Captions, secondary copy, card excerpts
- **Label Caps**: 10px / Manrope 700 / 0.3em tracking — Category labels, section overlines, status chips

### Spacing Principles
- **Line height in body**: 1.6 (relaxed reading) for article body; 1.2–1.35 (tight) for headlines
- **Letter spacing**: `-0.02em` to `-0.03em` on display headers (tighter = more authoritative); `+0.2em` to `+0.35em` on uppercase labels (wider = more legible at small sizes)
- **Measure (line length)**: Maximum 70 characters for article body — `max-w-2xl` to `max-w-3xl` on reading columns
- **Paragraph spacing**: `mb-4` (1rem) between body paragraphs; `mt-8 mb-3` before section headings within articles

## 4. Component Stylings

### Buttons

Pills (`border-radius: 9999px`) on all button variants — this is a non-negotiable brand shape choice. The rounded-full form communicates modernity and friendliness while standing out against the straight-edged article grid.

- **Primary** (Scoop Red fill): Solid `#b70100` background, white text, 2px red border. On hover: opacity 90%. Active: scale 97% for tactile press feedback.
- **Outline** (Ghost): Transparent background, 2px `#b70100` border, red text. On hover: fills with red, white text.
- **FillHover** (Animated): Transparent initial state, red sweep animation from left on hover. Used for main marketing CTAs.
- **Ghost / Text**: No border, muted text. For navigation-adjacent actions.
- **Breaking** (Signal): Full red-orange fill for urgent CTAs in news context.

All buttons: `cursor-pointer`, `active:scale-[0.97]`, min-height 40px (desktop), 44px (mobile touch target).

### Cards & Article Containers

Two modes of card: **Framed** (border + subtle shadow) and **Clean** (no frame, typography-only hierarchy).

- **News Card** (default article card): `border border-border`, `shadow-sm`, `rounded-xl` (0.75rem). On hover: border shifts to `primary/25`, shadow increases to `shadow-md`. Image scales 104% on hover.
- **Glass Card**: `backdrop-blur-16px`, 72% opacity white background, used for floating overlays, sticky headers.
- **Editorial Card** (sidebar / inline): Left border accent in Scoop Red (3px), no outer border, no shadow. Clean horizontal layout.
- **Featured Hero Card**: Full-bleed image, rounded-2xl, cinematic gradient overlay (black/90% bottom-to-top), text anchored bottom-left. Shadow: `0 20px 50px -20px rgba(0,0,0,0.25)`.
- **CardContent padding**: `p-4` (compact) or `p-5` (standard).

### Navigation

**Main header**: Sticky, `z-50`, 56px height. Glass morphism on scroll (`bg-background/95 backdrop-blur-sm`). Logo left, primary nav center (hidden mobile), actions right.

**Category sub-nav**: Second sticky strip, 40px height. Horizontal scroll on mobile with no scrollbar. Category links as uppercase labels (`10px / 700 / 0.12em tracking`). Active state: bottom 2px underline in primary red.

**Mobile**: Drawer from right edge. Hamburger → X icon. Full-height dark overlay. Same nav items as desktop but stacked vertically with `py-3` spacing.

**Active state logic**: Current page = red text + red bottom underline indicator. Hover = foreground color transition (150ms).

### Inputs & Forms

- Rounded pill inputs for newsletter and search: `border border-input`, `bg-background`, `rounded-full`, `px-4 py-2.5`, focus `ring-2 ring-ring`.
- Standard inputs in forms: `rounded-lg`, `border-input`, focus highlight with ring.
- Labels: always visible above fields, `10px / Manrope 700 / uppercase / 0.2em tracking`.
- Error states: `border-destructive`, error text in destructive color below field.

### Editorial Domain Components

**FeaturedHero**: Full-viewport-width image slot (min 480px tall), cinematic black gradient bottom-to-top, category pill (primary fill, 10px/700/0.2em tracking), Newsreader headline at `clamp(1.6rem, 4vw, 2.8rem)` anchored bottom-left, author avatar + date, "Lire →" CTA in white/95 that transitions to primary on group hover.

**ArticleCard (Compact)**: Aspect-video image with category label overlaid top-left on image (black/60 blur background), Newsreader title (14px/700/snug), MetaBar date below. Hover: border + shadow transition.

**ArticleCard (Row)**: Image 42% width left, text right. Category overline (10px/700/red), Newsreader title (20–24px), excerpt line-clamp-2, MetaBar.

**SectionHeader**: Three modes — `default` (label + line), `editorial` (3px red bar + bold label), `overline` (lines either side of label). Always Manrope, uppercase, 700 weight, 0.3em tracking.

**Badge/Category Pill**: `rounded-md` for editorial badges, `rounded-full` for category pills. Text 10px/700/uppercase/0.12em tracking. Primary color for editorial, muted for meta.

**Breaking News Ticker**: Marquee strip below main header. Background signal red, white text, 10px uppercase caps. Live pulse dot on left.

## 5. Layout Principles

### Grid & Structure

- **Max content width**: `max-w-7xl` (1280px) for full layouts; `max-w-4xl` (896px) for article reading column; `max-w-6xl` for article listing.
- **Homepage grid**: `grid-cols-[minmax(260px,300px)_1fr]` on desktop — fixed left sidebar, fluid main column. Single column on mobile.
- **Article detail grid**: `grid-cols-12` on large screens — article body `col-span-8`, context rail `col-span-4`. Full-width below `lg`.
- **Article listing**: `grid-cols-3` on large, `grid-cols-2` on medium, single on mobile. Gap: `gap-6`.
- **Responsive breakpoints**: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.

### Whitespace Strategy

- **Base unit**: 4px. All spacing in multiples of 4.
- **Page padding**: `px-4` mobile, `px-6` tablet, `px-8` desktop.
- **Section rhythm**: `py-8` mobile, `py-12` tablet, `py-16` desktop between major sections.
- **Article card gap**: `gap-6` (24px) in grids, `mb-14` (56px) between homepage sections.
- **Reading column max-width**: `max-w-2xl` to `max-w-3xl` — ~65–75 characters per line.

### Alignment & Visual Balance

- **Left-aligned** text throughout (NOT centered, except hero stats and newsletter CTA).
- Article cards: text below or beside images, left-aligned throughout.
- Featured hero: bottom-left anchored text over full-bleed image.
- Category labels: always left-aligned, above or overlaid on image.

### Responsive Behavior & Touch

- Mobile-first. All grids collapse to single column on mobile.
- **Touch targets**: 44px minimum on all interactive elements.
- **Carousels on mobile**: Edge-to-edge (`-mx-4 overflow-x-auto px-4`), snap scrolling, card width `min(272px, calc(100vw - 2.5rem))`.
- **Mobile dock**: Fixed bottom navigation bar with 5 main destinations.
- **Sticky header**: Height 56px main nav + optional 40px category strip. Content offset `pt-24` on pages.
- `prefers-reduced-motion` respected on all animations.

## 6. Design System Notes for Stitch Generation

### Language to Use

When prompting Stitch, use these descriptors:
- "Editorial news site for young pan-African readers"
- "Print-inspired serif headlines, modern sans-serif UI"
- "Off-white paper background, deep red accent"
- "Magazine grid layout with card-based article browsing"
- "Mobile-first, bold and direct, never fussy"
- "African cultural confidence — warm, ambitious, modern"

### Color References

| Role | Name | Hex |
|------|------|-----|
| Background | Off-White Paper | `#f9f9f9` |
| Brand Primary | Scoop Red | `#b70100` |
| Text | Near Black | `#1a1c1c` |
| Secondary Text | Editorial Gray | `#5f5e5e` |
| Card Surface | True White | `#ffffff` |
| Border | Warm Gray | `#e9e0de` |
| Accent | Editorial Gold | `#735c00` |
| Signal | Signal Red | `#e60000` |

### Component Prompts

**Homepage hero**:
"Full-bleed article image card, minimum 500px tall, cinematic bottom gradient overlay, category pill badge in Scoop Red top-left on image, Newsreader serif headline anchored bottom-left in white with drop shadow, author name and date, white pill CTA button that turns red on hover."

**Article listing page**:
"3-column responsive grid of news article cards on off-white background. Each card: aspect-video image with category label overlay, Newsreader title 18px, 2-line excerpt in gray, date meta. Horizontal pill filter tabs above grid for category filtering."

**Article reading page**:
"Editorial article reading layout. Left column 66% width: Newsreader headline 48px, lead paragraph 18px Manrope, full-width image with rounded corners and shadow, body text 16px/1.6 line-height, pull quotes with left red border. Right column 33%: sticky related articles rail."

**Newsletter CTA block**:
"Full-width banner with left red border accent (8px), off-white background, Newsreader headline, descriptor text, pill email input + red submit button. Feels like an editorial insert, not a popup."

### Incremental Iteration

When refining screens:
1. Start with typography hierarchy — ensure Newsreader headlines dominate visually.
2. Add the Scoop Red sparingly — category labels, one CTA, one active state per view.
3. Never center-align body text — left-align always for editorial credibility.
4. Images should be `aspect-video` (16:9) in cards, full-bleed in hero sections.
5. Use generous spacing (32–48px) between sections; tighter (16–24px) within cards.
