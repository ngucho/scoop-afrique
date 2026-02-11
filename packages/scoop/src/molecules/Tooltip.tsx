'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, content, children, side = 'top', ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div
        ref={ref}
        className={cn('relative inline-flex', className)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        {...props}
      >
        {children}
        {visible ? (
          <div
            role="tooltip"
            className={cn(
              'absolute z-50 max-w-xs border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md',
              side === 'top' && 'bottom-full left-1/2 mb-2 -translate-x-1/2',
              side === 'bottom' && 'left-1/2 top-full mt-2 -translate-x-1/2',
              side === 'left' && 'right-full top-1/2 mr-2 -translate-y-1/2',
              side === 'right' && 'left-full top-1/2 ml-2 -translate-y-1/2'
            )}
          >
            {content}
          </div>
        ) : null}
      </div>
    )
  }
)
Tooltip.displayName = 'Tooltip'

export { Tooltip }
