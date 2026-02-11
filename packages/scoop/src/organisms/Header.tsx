'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Logo } from '../atoms/Logo'
import { Button } from '../atoms/Button'
import { SearchInput } from '../atoms/SearchInput'
import { NavLinksList, type NavLinkItem } from '../molecules/NavLinksList'

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  logoHref?: string
  logoWordmark?: string
  logoSrc?: string
  navItems?: NavLinkItem[]
  showSearch?: boolean
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  /** Live indicator (e.g. "EN DIRECT") */
  liveLabel?: React.ReactNode
  ctaLabel?: string
  ctaHref?: string
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      logoHref = '/',
      logoWordmark,
      logoSrc,
      navItems = [],
      showSearch,
      searchPlaceholder = 'Rechercher',
      onSearch,
      liveLabel,
      ctaLabel,
      ctaHref,
      ...props
    },
    ref
  ) => (
    <header
      ref={ref}
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border bg-background',
        className
      )}
      {...props}
    >
      <div className="mx-auto flex h-14 max-w-[var(--content-max-width)] items-center justify-between gap-4 px-4">
        <Logo href={logoHref} wordmark={logoWordmark} src={logoSrc} />
        {navItems.length > 0 ? (
          <nav className="hidden md:block" aria-label="Principal">
            <NavLinksList title="Navigation" links={navItems} />
          </nav>
        ) : null}
        <div className="flex flex-1 items-center justify-end gap-2 md:flex-initial">
          {liveLabel ? (
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--signal)]">
              {liveLabel}
            </span>
          ) : null}
          {showSearch ? (
            <div className="hidden w-48 sm:block sm:w-64">
              <SearchInput
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          ) : null}
          {ctaLabel ? (
            <Button asChild variant="breaking" size="sm">
              <a href={ctaHref ?? '#'}>{ctaLabel}</a>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
)
Header.displayName = 'Header'

export { Header }
