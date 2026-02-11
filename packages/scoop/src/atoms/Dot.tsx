'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface DotProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
}

const Dot = React.forwardRef<HTMLSpanElement, DotProps>(
  ({ className, size = 'md', pulse = false, ...props }, ref) => (
    <span
      ref={ref}
      role="presentation"
      aria-hidden
      className={cn(
        'inline-block shrink-0 rounded-full bg-primary align-middle',
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    />
  )
)
Dot.displayName = 'Dot'

export { Dot }
