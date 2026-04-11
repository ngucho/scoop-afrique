'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AdSlotFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Short label shown in the chrome (e.g. "Publicité"). */
  label?: string
  /** Bannières / emplacements bas : moins de hauteur réservée, label resserré. */
  density?: 'default' | 'compact'
}

/**
 * Reserved ad surface — labeled frame, muted gradient, minimum touch-friendly padding.
 */
export function AdSlotFrame({
  className,
  label = 'Advertisement',
  density = 'default',
  children,
  ...props
}: AdSlotFrameProps) {
  const compact = density === 'compact'
  return (
    <aside
      role="complementary"
      aria-label={label}
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-lg)] border border-border',
        'bg-muted/25 shadow-sm',
        compact ? 'min-h-0 p-[var(--space-2)] sm:p-[var(--space-3)]' : 'min-h-[120px] p-[var(--space-4)]',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-[var(--space-2)]',
          'text-[length:var(--text-xs)] font-semibold uppercase tracking-[var(--tracking-wider)]',
          'text-muted-foreground',
          compact ? 'mb-1' : 'mb-[var(--space-3)]'
        )}
      >
        <span>{label}</span>
      </div>
      <div className="text-foreground">{children}</div>
    </aside>
  )
}
