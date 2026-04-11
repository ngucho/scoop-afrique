'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface EditorialStickyPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  heading: React.ReactNode
}

/** Panneau latéral sticky (formulaire tribune, widgets). */
export function EditorialStickyPanel({ heading, className, children, ...props }: EditorialStickyPanelProps) {
  return (
    <aside className={cn('lg:col-span-5', className)} {...props}>
      <div className="sticky top-24 rounded-2xl border border-border/60 bg-muted/40 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ fontFamily: 'var(--font-headline)' }}>
          {heading}
        </h3>
        {children}
      </div>
    </aside>
  )
}
