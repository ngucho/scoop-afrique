'use client'

import { Dot } from 'scoop'

/**
 * Full-screen loading animation using the Scoop logo dot.
 * Used in loading.tsx and for route transitions.
 */
export function ScoopDotLoader() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background"
      role="status"
      aria-label="Chargement"
    >
      <div className="flex items-center gap-2">
        <span className="font-[var(--font-scoop)] text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
          SCOOP
        </span>
        <Dot
          size="lg"
          className="scoop-loader-dot h-4 w-4 shrink-0 sm:h-5 sm:w-5"
          aria-hidden
        />
        <span className="font-sans text-2xl font-black uppercase tracking-tight text-primary sm:text-3xl">
          AFRIQUE
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="scoop-loader-dot-delay-0 h-1.5 w-1.5 rounded-full bg-primary/80" />
        <span className="scoop-loader-dot-delay-1 h-1.5 w-1.5 rounded-full bg-primary/80" />
        <span className="scoop-loader-dot-delay-2 h-1.5 w-1.5 rounded-full bg-primary/80" />
      </div>
    </div>
  )
}
