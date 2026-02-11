'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg'
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  default: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-2',
} as const

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-label="Chargement"
      className={cn(
        'inline-block animate-spin rounded-full border-primary border-t-transparent',
        sizeMap[size],
        className
      )}
      {...props}
    />
  )
)
Loader.displayName = 'Loader'

export { Loader }
