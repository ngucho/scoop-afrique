'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface StickyRailProps extends React.HTMLAttributes<HTMLElement> {
  offset?: string
  sticky?: 'top' | 'bottom'
}

/**
 * Sticky vertical rail with glass treatment — sidebars, tool rails, mini video stacks.
 */
export const StickyRail = React.forwardRef<HTMLElement, StickyRailProps>(
  ({ className, offset = 'var(--space-6)', sticky = 'top', style, ...props }, ref) => {
    const positionClass =
      sticky === 'top' ? 'top-[var(--sticky-offset)]' : 'bottom-[var(--sticky-offset)]'

    return (
      <aside
        ref={ref}
        className={cn(
          'sticky z-20 w-full max-w-full',
          positionClass,
          'rounded-[var(--radius-xl)] border border-[var(--glass-border)]',
          'bg-[var(--glass-bg)]/95 backdrop-blur-[var(--glass-blur-lg)]',
          'shadow-[var(--shadow-rail)]',
          'p-[var(--space-4)]',
          className
        )}
        style={
          {
            '--sticky-offset': offset,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      />
    )
  }
)
StickyRail.displayName = 'StickyRail'
