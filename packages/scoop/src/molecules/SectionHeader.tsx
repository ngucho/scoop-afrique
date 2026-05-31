'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  number?: string
  label: string
  labelClassName?: string
  /**
   * 'default'   — label à gauche, ligne à droite (horizontal rule)
   * 'editorial' — barre rouge gauche + label bold (magazine section)
   * 'overline'  — label centré entre deux lignes
   */
  variant?: 'default' | 'editorial' | 'overline'
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, number, label, labelClassName, variant = 'default', ...props }, ref) => {
    if (variant === 'editorial') {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-3', className)}
          {...props}
        >
          <span className="h-4 w-[3px] shrink-0 rounded-full bg-primary" aria-hidden />
          {number != null ? (
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {number}
            </span>
          ) : null}
          <span
            className={cn(
              'font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-foreground',
              labelClassName
            )}
          >
            {label}
          </span>
        </div>
      )
    }

    if (variant === 'overline') {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-4', className)}
          {...props}
        >
          <span className="h-px flex-1 bg-border" aria-hidden />
          <span
            className={cn(
              'shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-primary',
              labelClassName
            )}
          >
            {label}
          </span>
          <span className="h-px w-8 shrink-0 bg-primary" aria-hidden />
        </div>
      )
    }

    /* default — label gauche, séparateur droit */
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        {number != null ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {number}
          </span>
        ) : null}
        <span
          className={cn(
            'shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-primary',
            labelClassName
          )}
        >
          {label}
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>
    )
  }
)
SectionHeader.displayName = 'SectionHeader'

export { SectionHeader }
