# Motion guidelines

Scoop uses **CSS variables** and small React helpers in `packages/scoop` for consistent, accessible motion.

## Tokens (theme)

| Token | Typical use |
|--------|-------------|
| `--motion-duration-instant` … `--motion-duration-slow` | Enter, hover, layout shifts. |
| `--motion-ease-out`, `--motion-ease-spring` | UI enters vs playful emphasis (use sparingly). |
| `--motion-enter-distance` | Fade-up / slide distance for `scoop-motion-enter`. |
| `--motion-hover-lift` | Default lift for `scoop-motion-hover-depth`. |
| `--motion-parallax-range` | Pointer parallax cap (`SubtleParallax`). |

## Primitives

| API | Behavior |
|-----|----------|
| `.scoop-motion-enter` | Fade + slight translateY; **disabled** under `prefers-reduced-motion`. |
| `.scoop-motion-hover-depth` | Lift + shadow on hover; **no transform** when reduced motion. |
| `.scoop-motion-parallax` | Used with `SubtleParallax` — parallax **off** when reduced motion. |
| `MotionEnter` | Wrapper applying enter preset. |
| `SubtleParallax` | Pointer-driven offset; **no-ops** when reduced motion. |
| `usePrefersReducedMotion` | Client hook for conditional logic (e.g. skip parallax handlers). |

**Skeleton:** `.scoop-skeleton-glass` / `Skeleton variant="glass"` shimmer stops under reduced motion and falls back to solid `muted`.

## Marquee / ticker

`Ticker` and `.scoop-marquee` **stop animating** when `prefers-reduced-motion: reduce`. For critical content, duplicate it in a non-moving region.

## Do / Don’t

### Do

- Prefer **one** primary motion per surface (enter **or** hover depth, not competing timelines).
- Keep durations **under ~400ms** for UI chrome; use `--motion-ease-out` for exits and entrances.
- Respect **`prefers-reduced-motion`** — the theme already gates key classes; mirror that in custom CSS.
- Use **parallax** only for decorative hero media, never for text blocks.

### Don’t

- Don’t animate **layout-affecting** properties (width/height/top) on every interaction — use transform/opacity.
- Don’t chain **long** staggered delays on long lists without a cap (fatigue + delayed interactivity).
- Don’t use **infinite** motion for primary CTAs or form fields.
- Don’t rely on motion to convey **state** (loading, error); pair with text or `aria-live` where needed.

## Implementation reference

- CSS: `packages/scoop/src/theme.css` (`@keyframes scoop-enter-fade-up`, `scoop-skeleton-shimmer`, `@media (prefers-reduced-motion: reduce)`).
- Components: `packages/scoop/src/primitives/MotionEnter.tsx`, `SubtleParallax.tsx`.
- Visual tokens: [04-visual-system-translucent.md](./04-visual-system-translucent.md)
