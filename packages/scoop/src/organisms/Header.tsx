'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Logo } from '../atoms/Logo'
import { Button } from '../atoms/Button'
import { SearchInput } from '../atoms/SearchInput'
import { NavLinksList, type NavLinkItem } from '../molecules/NavLinksList'

export interface HeaderCategoryItem {
  label: string
  href: string
  active?: boolean
}

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  logoHref?: string
  logoWordmark?: string
  logoSrc?: string
  navItems?: NavLinkItem[]
  /** Rubriques / catégories affichées dans la bande sous la nav principale */
  categories?: HeaderCategoryItem[]
  showSearch?: boolean
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  /** Indicateur live (ex. "EN DIRECT") */
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
      categories = [],
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
      className={cn('sticky top-0 z-50 w-full', className)}
      {...props}
    >
      {/* Barre principale */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto flex h-14 max-w-[var(--content-max-width)] items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href={logoHref} wordmark={logoWordmark} src={logoSrc} />

          {navItems.length > 0 ? (
            <nav className="hidden md:block" aria-label="Principal">
              <NavLinksList title="Navigation" links={navItems} />
            </nav>
          ) : null}

          <div className="flex flex-1 items-center justify-end gap-2 md:flex-initial">
            {liveLabel ? (
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--signal)]">
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--signal)] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
                </span>
                {liveLabel}
              </span>
            ) : null}

            {showSearch ? (
              <div className="hidden w-44 sm:block sm:w-56">
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
      </div>

      {/* Bande rubriques / catégories */}
      {categories.length > 0 ? (
        <div className="border-b border-border bg-background/98 backdrop-blur-sm supports-[backdrop-filter]:bg-background/95">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4 sm:px-6">
            <nav
              aria-label="Rubriques"
              className="no-scrollbar flex items-center gap-0 overflow-x-auto"
            >
              {categories.map((cat) => (
                <a
                  key={cat.href}
                  href={cat.href}
                  className={cn(
                    'relative shrink-0 px-3 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-150 whitespace-nowrap',
                    cat.active
                      ? 'text-primary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-primary after:content-[""]'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {cat.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  )
)
Header.displayName = 'Header'

export { Header }
