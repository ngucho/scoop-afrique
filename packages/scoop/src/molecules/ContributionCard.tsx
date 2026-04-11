'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface ContributionCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  kindLabel: string
  heading: React.ReactNode
  excerpt: string
  /** Infos lieu / date, etc. */
  meta?: React.ReactNode
  footer: React.ReactNode
}

/** Carte contribution lecteur (liste tribune). */
export function ContributionCard({
  kindLabel,
  heading,
  excerpt,
  meta,
  footer,
  className,
  ...props
}: ContributionCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col justify-between rounded-2xl border border-transparent bg-card p-6 shadow-sm outline outline-1 outline-transparent transition-colors hover:bg-background hover:outline-border',
        className
      )}
      {...props}
    >
      <div>
        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-primary">{kindLabel}</span>
        <div className="text-xl font-bold leading-snug" style={{ fontFamily: 'var(--font-headline)' }}>
          {heading}
        </div>
        <p className="mt-2 line-clamp-3 text-sm italic text-muted-foreground">{excerpt}</p>
        {meta ? <div className="mt-2 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{footer}</p>
    </article>
  )
}
