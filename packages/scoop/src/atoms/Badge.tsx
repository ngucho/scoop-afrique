'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-2 px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'border border-primary/30 bg-primary/5 text-primary',
        breaking: 'border border-[var(--signal)] bg-[var(--signal)]/10 text-[var(--signal)]',
        muted: 'border border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />
  )
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
