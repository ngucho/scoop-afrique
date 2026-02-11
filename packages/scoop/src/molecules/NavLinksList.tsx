'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { linkVariants } from '../atoms/Link'

export interface NavLinkItem {
  label: string
  href: string
  external?: boolean
}

export interface NavLinksListProps extends React.HTMLAttributes<HTMLUListElement> {
  title: string
  links: NavLinkItem[]
  linkComponent?: React.ComponentType<{ href: string; className?: string; children: React.ReactNode }>
}

const NavLinksList = React.forwardRef<HTMLUListElement, NavLinksListProps>(
  ({ title, links, linkComponent: LinkComponent, className, ...props }, ref) => (
    <div>
      <span className="mb-4 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </span>
      <ul ref={ref} className={cn('space-y-2', className)} {...props}>
        {links.map((link) => (
          <li key={link.label}>
            {LinkComponent ? (
              <LinkComponent href={link.href} className={cn(linkVariants())}>
                <span aria-hidden />
                {link.label}
              </LinkComponent>
            ) : link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(linkVariants())}
              >
                <span aria-hidden />
                {link.label}
              </a>
            ) : (
              <a href={link.href} className={cn(linkVariants())}>
                <span aria-hidden />
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
)
NavLinksList.displayName = 'NavLinksList'

export { NavLinksList }
