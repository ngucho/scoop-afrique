'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const cardVariants = cva(
  'rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface)] text-card-foreground shadow-[var(--shadow-sm)] transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'border-border',
        glass: 'bg-[var(--glass-bg)] border-[var(--glass-border)] backdrop-blur-[var(--glass-blur)] shadow-[var(--shadow-md)]',
        surface: 'bg-[var(--surface)] border-[var(--surface-border)]',
        news: 'border-border hover:border-primary/40 hover:shadow-[var(--shadow-md)]',
        video: 'border-border overflow-hidden',
        breaking: 'border-[var(--signal)] bg-[var(--signal)]/5',
        feature: 'border-primary/30 bg-primary/5',
        portrait: 'aspect-[3/4] flex flex-col',
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

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardFooter, cardVariants }
