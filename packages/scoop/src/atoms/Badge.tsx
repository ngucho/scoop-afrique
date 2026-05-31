'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-sans text-xs font-semibold',
  {
    variants: {
      variant: {
        default:
          'rounded-md border border-primary/20 bg-primary/[0.07] px-2.5 py-1 uppercase tracking-[0.12em] text-primary',
        breaking:
          'rounded-md border border-[var(--signal)] bg-[var(--signal)]/10 px-2.5 py-1 uppercase tracking-[0.12em] text-[var(--signal)]',
        muted:
          'rounded-md border border-border bg-muted px-2.5 py-1 uppercase tracking-[0.12em] text-muted-foreground',
        pill:
          'rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1 uppercase tracking-[0.1em] text-primary',
        category:
          'rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-primary cursor-pointer',
        live:
          'rounded-full border border-[var(--signal)] bg-[var(--signal)] px-3 py-1 uppercase tracking-[0.1em] text-white shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Affiche un indicateur de live pulsant */
  pulse?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, pulse, children, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant, className }))} {...props}>
      {pulse ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </div>
  )
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
