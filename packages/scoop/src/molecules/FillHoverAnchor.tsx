'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { buttonVariants } from '../atoms/Button'

export interface FillHoverAnchorProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: 'sm' | 'default' | 'lg'
}

/**
 * Anchor that looks like the primary CTA button with fill-on-hover.
 * Use for links that must look like buttons (SSR-safe, no CVA runtime issue).
 */
const FillHoverAnchor = React.forwardRef<HTMLAnchorElement, FillHoverAnchorProps>(
  ({ className, size = 'default', children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(buttonVariants({ variant: 'fillHover', size }), className)}
      data-hover
      {...props}
    >
      <span
        className="absolute inset-0 -translate-x-full bg-primary transition-transform duration-300 group-hover:translate-x-0"
        aria-hidden
      />
      <span className="relative z-10">{children}</span>
    </a>
  )
)
FillHoverAnchor.displayName = 'FillHoverAnchor'

export { FillHoverAnchor }
