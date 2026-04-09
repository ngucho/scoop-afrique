'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AdSlotFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Short label shown in the chrome (e.g. "Publicité"). */
  label?: string
}

/**
 * Reserved ad surface — labeled frame, muted gradient, minimum touch-friendly padding.
 */
export function AdSlotFrame({
  className,
  label = 'Advertisement',
  children,
  ...props
}: AdSlotFrameProps) {
  return (
    <aside
      role="complementary"
      aria-label={label}
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--surface-border)]',
        'bg-[var(--gradient-ad-muted)] p-[var(--space-4)]',
        'shadow-[var(--shadow-sm)]',
        'min-h-[120px]',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'mb-[var(--space-3)] flex items-center justify-between gap-[var(--space-2)]',
          'text-[length:var(--text-xs)] font-semibold uppercase tracking-[var(--tracking-wider)]',
          'text-[var(--on-glass-muted)]'
        )}
      >
        <span>{label}</span>
      </div>
      <div className="text-[var(--on-glass-foreground)]">{children}</div>
    </aside>
  )
}
