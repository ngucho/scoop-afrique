'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export const linkVariants = () =>
  'group inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary [&>span]:h-px [&>span]:w-0 [&>span]:bg-primary [&>span]:transition-all [&>span]:duration-300 group-hover:[&>span]:w-4'

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(linkVariants(), className)}
      data-hover
      {...props}
    >
      <span aria-hidden />
      {children}
    </a>
  )
)
Link.displayName = 'Link'

export { Link }
