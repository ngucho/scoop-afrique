'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const cardVariants = cva(
  'border bg-[var(--surface)] text-card-foreground transition-all duration-300',
  {
    variants: {
      variant: {
        default:
          'rounded-[var(--radius-xl)] border-[var(--surface-border)] shadow-[var(--shadow-sm)]',
        glass:
          'rounded-[var(--radius-xl)] border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-[var(--shadow-md)]',
        surface:
          'rounded-[var(--radius-xl)] border-[var(--surface-border)] shadow-[var(--shadow-sm)]',
        news:
          'rounded-[var(--radius-xl)] border-border shadow-[var(--shadow-sm)] hover:border-primary/25 hover:shadow-[var(--shadow-md)] cursor-pointer',
        editorial:
          'rounded-r-[var(--radius-md)] rounded-l-none border-l-[3px] border-l-primary border-y-border border-r-border bg-card shadow-none hover:bg-muted/30',
        video:
          'rounded-[var(--radius-xl)] overflow-hidden border-border shadow-[var(--shadow-sm)]',
        breaking:
          'rounded-[var(--radius-xl)] border-[var(--signal)] bg-[var(--signal)]/5 shadow-[var(--shadow-sm)]',
        feature:
          'rounded-[var(--radius-xl)] border-primary/20 bg-primary/5 shadow-[var(--shadow-sm)]',
        portrait:
          'aspect-[3/4] rounded-[var(--radius-xl)] overflow-hidden flex flex-col border-border shadow-[var(--shadow-md)]',
        elevated:
          'rounded-[var(--radius-xl)] border-border shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-5', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardFooter, cardVariants }
