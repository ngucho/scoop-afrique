# Implementation Plan: Scoop Afrique Frontend Redesign

## Overview
Redesign the frontend around a modern, street, streaming-like reading experience: one clear next action, horizontal rails, stable media containers, strong search, mobile-first navigation, and a denser admin dashboard with operational signals.

## Architecture Decisions
- Keep the new home direction as the visual source of truth: dark navigation, warm neutral canvas, red brand signal, neon highlight for discovery.
- Source colors, radii, shadows and surface decisions from `packages/scoop/src/theme.css`: light background, near-black foreground, brand red primary, muted/card/secondary for discreet support.
- Move repeated article surfaces into shared reader components so article lists, category pages, search, video and related content stay consistent.
- Keep media containers dimensioned with fixed aspect ratios; use `object-contain` where preserving the full image matters and `object-cover` only where cropping is intentional.
- Redesign admin in functional layers: dashboard first, then article workflow, reader operations, team/settings.

## Task List

### Phase 1: Reader Foundation
- [x] Home: streaming-style hero, search, rails and queue.
- [x] Header: one-line info strip, dark street navigation.
- [x] Media: stable cover image container with configurable fit.
- [ ] Shared reader card primitives for poster, queue row and compact result.

### Phase 2: Public Reading Flow
- [ ] Articles index: search-first page, rail/category filters, mobile-first result cards.
- [ ] Article detail: immersive but readable article player, stable cover, sticky next/read controls.
- [ ] Category/rubrique pages: same stream model as home, fewer competing blocks.
- [ ] Search page: full-screen discovery page with direct route to results.
- [ ] Video/podcast/newsletter/static pages: align visual DNA without overbuilding.

### Checkpoint: Public Flow
- [ ] `@scoop-afrique/frontend` tests pass.
- [ ] Frontend TypeScript passes.
- [ ] Targeted ESLint passes for touched files.
- [ ] `next build --webpack` succeeds.
- [ ] Runtime check for home, articles, article detail, category and search.

### Phase 3: Admin Shell And Dashboard
- [ ] Admin layout/navigation: compact operational shell, mobile usable.
- [ ] Dashboard: add useful information density: editorial pipeline, traffic, newsletter, ads, top content, pending actions.
- [ ] Article management pages: table/cards, filters, status clarity, fast actions.
- [ ] Reader operations pages: ads, homepage, newsletters, subscribers, announcements.

### Checkpoint: Admin Core
- [ ] Admin pages compile and remain accessible.
- [ ] Existing admin fetchers/types still match API contracts.
- [ ] Known pre-existing lint errors are either fixed in touched files or documented.

### Phase 4: Remaining Pages And Polish
- [ ] Account/login, legal/about/contact pages aligned to new DNA.
- [ ] Tribune pages aligned without breaking social workflow.
- [ ] Design system tokens/components reviewed for radius, surfaces, buttons, cards and nav.
- [ ] Mobile checks at 320, 768, 1024 and desktop.

## Risks And Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Scope is large across 44 pages | High | Work in vertical lots, verify after each lot |
| Admin has existing lint failures | Medium | Keep touched files clean, fix admin lint as pages are redesigned |
| Dynamic backend data can be absent | Medium | Preserve existing fallback and empty states |
| Mobile rail overflow can hurt navigation | Medium | Use scrollable rails with visible search and queue alternatives |

## Current Focus
Lot 1 after home: `articles`, `articles/[slug]`, `category/[slug]`, `search`, shared reader cards.
