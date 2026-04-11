'use client'

import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../utils/cn'

export type BrandsHeaderLinkProps = {
  href: string
  className?: string
  children?: React.ReactNode
  prefetch?: boolean
  target?: string
  rel?: string
  'aria-label'?: string
}

export interface BrandsMarketingHeaderProps {
  Link: React.ComponentType<BrandsHeaderLinkProps>
  logo: React.ReactNode
  backLink?: { href: string; label: string } | null
  navItems: { href: string; label: string; active: boolean }[]
  /** Desktop : thème + CTA (ex. CtaLink). */
  rightSlot: React.ReactNode
  /** Barre mobile horizontale : compléter par CTA court si besoin. */
  mobileTrailing?: React.ReactNode
  className?: string
}

/**
 * Header marketing marques — bordures / fonds sémantiques (réutilisable hors Next).
 */
export function BrandsMarketingHeader({
  Link,
  logo,
  backLink,
  navItems,
  rightSlot,
  mobileTrailing,
  className,
}: BrandsMarketingHeaderProps) {
  const pillClass = (active: boolean) =>
    cn(
      'shrink-0 rounded-full px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors sm:px-4 sm:py-2.5 sm:text-xs',
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary'
    )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70',
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-0">
        <div className="flex min-h-[var(--touch-target,44px)] items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 md:px-12 lg:px-20">
          <div className="flex shrink-0 items-center gap-4">
            {logo}
            {backLink ? (
              <Link
                href={backLink.href}
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                prefetch={false}
                aria-label={backLink.label}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{backLink.label}</span>
              </Link>
            ) : null}
          </div>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={pillClass(item.active)} prefetch={false}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">{rightSlot}</div>
        </div>
        <div className="flex overflow-x-auto border-t border-border/60 px-4 py-2 sm:px-6 md:hidden [scrollbar-width:thin]">
          <div className="flex min-w-0 gap-1.5">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={pillClass(item.active)} prefetch={false}>
                {item.label}
              </Link>
            ))}
            {mobileTrailing}
          </div>
        </div>
      </div>
    </header>
  )
}
