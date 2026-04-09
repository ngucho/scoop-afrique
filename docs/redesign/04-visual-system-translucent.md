# Visual system — translucent media UI

This document describes the **glass / translucent** layer of the Scoop design system (`packages/scoop`, `scoop/theme.css`). It complements semantic colors (`background`, `foreground`, `primary`) with surfaces that sit **on top of photography, video, or gradients**.

## Design tokens

| Token | Role |
|--------|------|
| `--glass-bg`, `--glass-bg-elevated`, `--glass-bg-sunken` | Frosted fill levels (stacked UI, inset wells). |
| `--glass-border`, `--glass-border-strong`, `--glass-border-inner` | Outer edge, emphasis, inner highlight. |
| `--glass-blur` … `--glass-blur-xl` | Backdrop blur radii; prefer **md** for cards, **lg** for rails. |
| `--glass-scrim` | Light wash behind type in bars (announcements). |
| `--on-glass-foreground`, `--on-glass-muted` | **Mandatory** text on glass (not raw `foreground` on heavy blur unless contrast-checked). |
| `--gradient-glass-sheen`, `--gradient-glass-edge` | Specular + edge falloff (used by `GlassCard`). |
| `--shadow-glass-layer-1/2`, `--shadow-glass-float`, `--shadow-rail` | Layered depth: cards, hover lift, sticky rails. |
| `--gradient-ad-muted` | Reserved, low-chrome surfaces (see `AdSlotFrame`). |

Light and dark roots both define these; **always test both themes** when placing glass on imagery.

## Primitives

| Component | Use |
|-----------|-----|
| `GlassCard` | Primary frosted panel: hero copy, overlays, modals-as-cards. |
| `StickyRail` | Sticky sidebar / tool rail with blur + rail shadow. |
| `Ticker` | Marquee row (sponsorships, live tags); keep **short** labels. |
| `AnnouncementBar` | Full-width strip; use **`foreground` / `muted-foreground`** for body text, or `variant="signal"` for high emphasis. |
| `AdSlotFrame` | Labeled ad placeholder; keeps IAB-style clarity without pretending to be editorial chrome. |

**Card vs GlassCard:** `Card` supports `variant="glass"` for list/article tiles. `GlassCard` adds sheen/edge layers and optional **interactive** depth — use when the panel is the focal overlay.

## Accessibility — contrast

1. **Text on glass:** Prefer `--on-glass-foreground` and `--on-glass-muted` on `GlassCard`, `AnnouncementBar` (default), and `AdSlotFrame` content areas. On **busy** photos, add a **scrim** (`--glass-scrim`, gradient overlay, or darker `hero` gradient) so WCAG contrast holds.
2. **Never** rely on blur alone for readability; blur reduces perceived contrast on some displays.
3. **Signal / breaking:** Use `AnnouncementBar variant="signal"` or solid `Badge` / `Card` variants when legibility must not fail.

## Reduced motion

CSS utilities `scoop-motion-enter`, `scoop-marquee`, `scoop-skeleton-glass`, and component-level hooks respect **`prefers-reduced-motion`**. Do not add infinite animations without a reduced-motion fallback (see `05-motion-guidelines.md`).

## Do / Don’t

### Do

- Use **token-backed** borders and shadows (`--glass-border`, `--shadow-glass-*`) so light/dark stay aligned.
- Place glass **above** intentional imagery or gradients; keep **padding** generous (`--space-*`).
- Use **`AdSlotFrame`** (or equivalent labeling) for monetization so users can distinguish ads from editorial.
- Test **keyboard** and **screen reader** order when stacking glass panels (modals, drawers, rails).

### Don’t

- Don’t stack **many** full-viewport glass layers (performance and visual noise).
- Don’t put **long-form reading** body copy solely on heavy blur without a solid or scrim behind it.
- Don’t use **ticker/marquee** for essential information users must read slowly; provide the same info **statically** elsewhere.
- Don’t override `--on-glass-*` with arbitrary low-contrast grays.

## Related

- Motion: [05-motion-guidelines.md](./05-motion-guidelines.md)
- Theme entry: `packages/scoop/src/theme.css`
