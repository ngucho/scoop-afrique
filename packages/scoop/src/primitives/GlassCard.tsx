'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const glassCardVariants = cva(
  [
    'relative overflow-hidden rounded-[var(--radius-xl)] border',
    'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--on-glass-foreground)]',
    'backdrop-blur-[var(--glass-blur-md)] shadow-[var(--shadow-glass-layer-2)]',
    'transition-[transform,box-shadow] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'isolate',
    'before:pointer-events-none before:absolute before:inset-0 before:-z-[1] before:rounded-[inherit]',
    'before:bg-[var(--gradient-glass-sheen)] before:opacity-[0.35]',
    'after:pointer-events-none after:absolute after:inset-px after:-z-[1] after:rounded-[calc(var(--radius-xl)-1px)]',
    'after:bg-[var(--gradient-glass-edge)] after:opacity-25',
  ],
  {
    variants: {
      elevation: {
        default: '',
        raised:
          'bg-[var(--glass-bg-elevated)] border-[var(--glass-border-strong)] shadow-[var(--shadow-glass-float)]',
        inset: 'bg-[var(--glass-bg-sunken)] shadow-[inset_0_1px_2px_oklch(0_0_0/0.06)]',
      },
      interactive: {
        false: '',
        true: 'scoop-motion-hover-depth cursor-default',
      },
    },
    defaultVariants: {
      elevation: 'default',
      interactive: false,
    },
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, elevation, interactive, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(glassCardVariants({ elevation, interactive }), className)}
      style={{
        transitionDuration: 'var(--motion-duration-fast)',
        ...style,
      }}
      {...props}
    />
  )
)
GlassCard.displayName = 'GlassCard'

export { glassCardVariants }
