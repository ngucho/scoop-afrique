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
  /**
   * Remplace la rangée « rubriques » (ex. Tribune : accès rapide).
   * Si défini, `categoryNav` est ignoré pour cette rangée.
   */
  secondaryNav?: React.ReactNode
  searchHref: string
  searchAriaLabel?: string
  accountHref: string
  accountLabel?: string
  /** Ex. ThemeToggle `className="hidden sm:flex"` — uniquement dans la barre desktop. */
  rightSlot?: React.ReactNode
  /** Ex. ThemeToggle sans masquage — affiché en bas du drawer mobile. */
  drawerFooterSlot?: React.ReactNode
  /** Contenu supplémentaire dans le drawer (ex. liens Tribune). */
  mobileDrawerExtra?: React.ReactNode
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
  secondaryNav,
  searchHref,
  searchAriaLabel = 'Rechercher',
  accountHref,
  accountLabel = 'Compte',
  rightSlot,
  drawerFooterSlot,
  mobileDrawerExtra,
  brandsHref,
  brandsLabel = 'Espace annonceurs',
  className,
}: EditorialReaderHeaderProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const navLinkClass = (active: boolean) =>
    cn(
      'rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'text-background/78 hover:bg-background/10 hover:text-background'
    )

  const catLinkClass = (active: boolean) =>
    cn(
      'whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors',
      active ? 'bg-secondary text-foreground' : 'bg-background/7 text-background/72 hover:bg-background/12 hover:text-background'
    )

  const drawerLinkClass = 'rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'

  return (
    <div className={cn('min-w-0 max-w-full', className)}>
      {banner}

      <header className="sticky top-0 z-50 w-full min-w-0 max-w-full border-b border-background/10 bg-foreground text-background">
        <div className="mx-auto flex h-[72px] max-w-[1460px] min-w-0 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="rounded-full p-2 text-background transition-colors hover:bg-background/10 md:hidden"
              aria-label="Menu"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href={logoHref} className="min-w-0 max-w-full shrink" aria-label={logoAriaLabel}>
              {logo}
            </Link>
          </div>

          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Navigation">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
            {rightSlot}
            <Link
              href={searchHref}
              className="rounded-full bg-card px-3 py-2 text-foreground transition-colors hover:bg-secondary"
              aria-label={searchAriaLabel}
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href={accountHref}
              className="hidden rounded-full border border-background/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:border-primary hover:bg-primary sm:inline-flex"
            >
              {accountLabel}
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-[1460px] min-w-0 overflow-x-auto border-t border-background/10 px-4 pb-2 pt-2 [scrollbar-width:none] sm:px-6 lg:px-10 [&::-webkit-scrollbar]:hidden">
          {secondaryNav ? (
            <div className="min-w-0 py-2">{secondaryNav}</div>
          ) : (
            <nav className="flex min-w-0 items-center gap-2" aria-label="Rubriques">
              {categoryNav.map((item) => (
                <Link key={item.href} href={item.href} className={catLinkClass(item.active)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-foreground/40 md:hidden"
            aria-label="Fermer le menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[70] w-[min(100%,20rem)] border-r border-background/10 bg-foreground p-4 text-background shadow-lg md:hidden">
            <div className="mb-6 flex items-center justify-between">
              <Link href={logoHref} aria-label={logoAriaLabel} onClick={() => setDrawerOpen(false)}>
                {logo}
              </Link>
              <button type="button" className="rounded-full p-2 hover:bg-background/10" aria-label="Fermer" onClick={() => setDrawerOpen(false)}>
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
              {mobileDrawerExtra}
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
