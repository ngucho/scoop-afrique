'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { linkVariants } from '../atoms/Link'

export interface BackLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string
  children?: React.ReactNode
}

/**
 * Link styled for "back to home" or navigation, with optional icon slot.
 */
const BackLink = React.forwardRef<HTMLAnchorElement, BackLinkProps>(
  ({ href = '/', className, children = "Retour à l'accueil", ...props }, ref) => (
    <a ref={ref} href={href} className={cn(linkVariants(), className)} data-hover {...props}>
      <span aria-hidden />
      {children}
    </a>
  )
)
BackLink.displayName = 'BackLink'

export { BackLink }
