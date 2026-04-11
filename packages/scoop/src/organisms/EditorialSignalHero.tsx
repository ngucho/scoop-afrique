'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface EditorialSignalHeroProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow: string
  heading: React.ReactNode
  description: React.ReactNode
  /** CTA ou lien (optionnel). */
  actions?: React.ReactNode
}

/**
 * Bandeau héro “signal” (dégradé primary) — tribune, campagnes, etc.
 */
export function EditorialSignalHero({
  eyebrow,
  heading,
  description,
  actions,
  className,
  ...props
}: EditorialSignalHeroProps) {
  return (
    <section
      className={cn(
        'relative mb-12 flex flex-col gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#e60000] p-8 text-primary-foreground shadow-lg md:mb-14 md:flex-row md:items-center md:p-14',
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ background: 'linear-gradient(135deg,var(--primary) 0%,#e60000 100%)' }}
        aria-hidden
      />
      <div className="relative z-10 max-w-xl space-y-5">
        <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-xs font-bold uppercase tracking-widest">
          {eyebrow}
        </span>
        <div className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl [&_h1]:m-0" style={{ fontFamily: 'var(--font-headline)' }}>
          {heading}
        </div>
        <div className="max-w-lg text-lg text-white/90 [&_p]:m-0">{description}</div>
        {actions}
      </div>
    </section>
  )
}
