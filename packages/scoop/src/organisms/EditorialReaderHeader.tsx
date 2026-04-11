'use client'

import * as React from 'react'
import { Menu, Search, X } from 'lucide-react'
import { cn } from '../utils/cn'

export type EditorialReaderHeaderLinkProps = {
  href: string
  className?: string
  children?: React.ReactNode
  onClick?: () => void
  target?: string
  rel?: string
  prefetch?: boolean
  'aria-label'?: string
}

export interface EditorialReaderHeaderProps {
  /** Bandeau au-dessus (ex. AnnouncementBar + contenu). */
  banner?: React.ReactNode
  /** Composant lien compatible Next `Link` ou `<a>`. */
  Link: React.ComponentType<EditorialReaderHeaderLinkProps>
  logo: React.ReactNode
  logoHref: string
  logoAriaLabel?: string
  mainNav: { href: string; label: string; active: boolean }[]
  categoryNav: { href: string; label: string; active: boolean }[]
  searchHref: string
  searchAriaLabel?: string
  accountHref: string
  accountLabel?: string
  /** Ex. ThemeToggle `className="hidden sm:flex"` — uniquement dans la barre desktop. */
  rightSlot?: React.ReactNode
  /** Ex. ThemeToggle sans masquage — affiché en bas du drawer mobile. */
  drawerFooterSlot?: React.ReactNode
  brandsHref?: string
  brandsLabel?: string
  className?: string
}

/**
 * Header lecteur sticky + rubriques + drawer mobile — styles design system uniquement.
 */
export function EditorialReaderHeader({
  banner,
  Link,
  logo,
  logoHref,
  logoAriaLabel = 'Accueil',
  mainNav,
  categoryNav,
  searchHref,
  searchAriaLabel = 'Rechercher',
  accountHref,
  accountLabel = 'Compte',
  rightSlot,
  drawerFooterSlot,
  brandsHref,
  brandsLabel = 'Espace annonceurs',
  className,
}: EditorialReaderHeaderProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const navLinkClass = (active: boolean) =>
    cn(
      'text-xs font-medium uppercase tracking-widest transition-opacity hover:opacity-80',
      active ? 'font-bold text-primary' : 'text-muted-foreground'
    )

  const catLinkClass = (active: boolean) =>
    cn(
      'whitespace-nowrap pb-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors',
      active ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
    )

  const drawerLinkClass = 'rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted'

  return (
    <div className={className}>
      {banner}

      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-full p-2 text-foreground transition-opacity hover:opacity-80 md:hidden"
              aria-label="Menu"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href={logoHref} className="min-w-0 shrink" aria-label={logoAriaLabel}>
              {logo}
            </Link>
          </div>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {rightSlot}
            <Link
              href={searchHref}
              className="rounded-full p-2 text-foreground transition-opacity hover:opacity-80"
              aria-label={searchAriaLabel}
            >
              <Search className="h-6 w-6" />
            </Link>
            <Link
              href={accountHref}
              className="hidden rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-muted sm:inline-flex"
            >
              {accountLabel}
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl overflow-x-auto border-t border-transparent px-4 pb-2 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          <nav className="flex items-center gap-6 py-2" aria-label="Rubriques">
            {categoryNav.map((item) => (
              <Link key={item.href} href={item.href} className={catLinkClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
            aria-label="Fermer le menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[70] w-[min(100%,20rem)] border-r border-border bg-background p-4 shadow-lg md:hidden">
            <div className="mb-6 flex items-center justify-between">
              <Link href={logoHref} aria-label={logoAriaLabel} onClick={() => setDrawerOpen(false)}>
                {logo}
              </Link>
              <button type="button" className="rounded-lg p-2" aria-label="Fermer" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Menu mobile">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={drawerLinkClass}
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href={searchHref} className={drawerLinkClass} onClick={() => setDrawerOpen(false)}>
                Rechercher
              </Link>
              <Link href={accountHref} className={drawerLinkClass} onClick={() => setDrawerOpen(false)}>
                Mon compte
              </Link>
              {brandsHref ? (
                <a
                  href={brandsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 rounded-lg px-3 py-2 text-xs text-muted-foreground"
                >
                  {brandsLabel}
                </a>
              ) : null}
            </nav>
            {drawerFooterSlot ? <div className="mt-6">{drawerFooterSlot}</div> : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
