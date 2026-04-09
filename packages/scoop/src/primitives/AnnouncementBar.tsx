'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AnnouncementBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visually emphasized; still uses solid scrim behind copy for contrast. */
  variant?: 'default' | 'signal' | 'subtle'
}

/**
 * Full-width announcement strip — always pair with `foreground` / `muted-foreground` for text.
 */
export function AnnouncementBar({
  className,
  variant = 'default',
  children,
  ...props
}: AnnouncementBarProps) {
  return (
    <div
      role="region"
      aria-label="Announcement"
      className={cn(
        'relative overflow-hidden border-b border-[var(--glass-border)]',
        'px-[var(--margin-page)] py-[var(--space-3)] text-[var(--on-glass-foreground)]',
        'backdrop-blur-[var(--glass-blur-sm)]',
        variant === 'default' &&
          'bg-[var(--glass-scrim)] supports-[backdrop-filter]:bg-[var(--glass-bg)]/90',
        variant === 'signal' &&
          'border-[var(--signal)]/35 bg-[var(--signal)]/12 text-[var(--foreground)]',
        variant === 'subtle' && 'bg-muted/90 text-foreground',
        className
      )}
      {...props}
    >
      <div className="relative z-[1] mx-auto flex max-w-[var(--content-max-width)] flex-wrap items-center justify-center gap-x-[var(--space-4)] gap-y-[var(--space-2)] text-center text-sm font-medium leading-snug">
        {children}
      </div>
    </div>
  )
}
