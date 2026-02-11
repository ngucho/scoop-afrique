'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const alertVariants = cva(
  'relative w-full border px-4 py-3 font-sans text-sm',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        error: 'border-destructive/50 bg-destructive/5 text-destructive',
        success: 'border-[var(--state-success)]/50 bg-[var(--state-success)]/10 text-[var(--state-success)]',
        warning: 'border-[var(--state-warning)]/50 bg-[var(--state-warning)]/10 text-[var(--state-warning)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  )
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }
