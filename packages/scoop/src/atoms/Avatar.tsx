'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: React.ReactNode
  size?: 'sm' | 'default' | 'lg'
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  default: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = '', fallback, size = 'default', ...props }, ref) => {
    const [loaded, setLoaded] = React.useState(true)
    const initials = fallback ?? (typeof alt === 'string' ? alt.slice(0, 2).toUpperCase() : '?')
    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-sans font-medium text-muted-foreground',
          sizeMap[size],
          className
        )}
        {...props}
      >
        {src ? (
          <>
            <img
              src={src}
              alt={alt}
              className={cn(
                'h-full w-full object-cover',
                !loaded && 'invisible absolute inset-0'
              )}
              onLoad={() => setLoaded(true)}
            />
            {!loaded ? (
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                {initials}
              </span>
            ) : null}
          </>
        ) : (
          <span aria-hidden>{initials}</span>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar }
