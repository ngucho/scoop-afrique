'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface SourceProps extends React.HTMLAttributes<HTMLSpanElement> {
  href?: string
}

const Source = React.forwardRef<HTMLSpanElement, SourceProps>(
  ({ className, href, children, ...props }, ref) => {
    const baseClass = 'font-sans text-xs uppercase tracking-wider text-muted-foreground'
    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(baseClass, 'hover:text-primary', className)}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      )
    }
    return (
      <span ref={ref} className={cn(baseClass, className)} {...props}>
        {children}
      </span>
    )
  }
)
Source.displayName = 'Source'

export { Source }
