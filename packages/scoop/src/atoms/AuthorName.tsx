'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AuthorNameProps extends React.HTMLAttributes<HTMLSpanElement> {
  href?: string
}

const AuthorName = React.forwardRef<HTMLSpanElement, AuthorNameProps>(
  ({ className, href, children, ...props }, ref) => {
    const baseClass = 'font-sans text-sm font-medium text-foreground'
    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(baseClass, 'hover:text-primary underline-offset-2 hover:underline', className)}
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
AuthorName.displayName = 'AuthorName'

export { AuthorName }
