'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface LogoProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** SVG source URL or inline React node (e.g. from import or public path) */
  src?: string
  children?: React.ReactNode
  /** Wordmark only (e.g. "Scoop") — uses font-scoop (Brasika) */
  wordmark?: string
  size?: 'sm' | 'default' | 'lg'
}

const sizeMap = {
  sm: 'h-6',
  default: 'h-8',
  lg: 'h-10',
} as const

const Logo = React.forwardRef<HTMLAnchorElement, LogoProps>(
  ({ className, href = '/', src, children, wordmark, size = 'default', ...props }, ref) => {
    const content = wordmark ? (
      <span className={cn('font-[var(--font-scoop)] font-bold tracking-tight', sizeMap[size])}>
        {wordmark}
      </span>
    ) : src ? (
      <img src={src} alt="" className={cn('h-full w-auto', sizeMap[size])} aria-hidden />
    ) : (
      children
    )
    return (
      <a
        ref={ref}
        href={href}
        className={cn('inline-flex items-center gap-2 text-foreground hover:text-primary', className)}
        {...props}
      >
        {content}
      </a>
    )
  }
)
Logo.displayName = 'Logo'

export { Logo }
