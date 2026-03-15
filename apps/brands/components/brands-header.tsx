'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from 'scoop'
import { CtaButton } from '@/components/cta-button'
import { BrandsLogo } from '@/components/brands-logo'

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Services', href: '/services' },
  { label: 'Réalisations', href: '/realisations' },
  { label: 'Contact', href: '/contact' },
]

function getBackLink(pathname: string): { href: string; label: string } | null {
  if (pathname === '/') return null
  if (pathname.startsWith('/services/')) return { href: '/services', label: 'Retour aux services' }
  if (pathname === '/strategie-editoriale') return { href: '/a-propos', label: "Retour à l'À propos" }
  return { href: '/', label: "Retour à l'accueil" }
}

export function BrandsHeader() {
  const pathname = usePathname()
  const backLink = getBackLink(pathname)

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] supports-[backdrop-filter]:bg-[var(--glass-bg)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-0">
        <div className="flex min-h-[var(--touch-target)] items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 md:px-12 lg:px-20">
          <div className="flex shrink-0 items-center gap-4">
            <BrandsLogo />
            {backLink && (
              <Link
                href={backLink.href}
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                aria-label={backLink.label}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{backLink.label}</span>
              </Link>
            )}
          </div>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors sm:px-4 sm:py-2.5 sm:text-xs hover:text-primary ${
                  pathname === link.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <CtaButton href="/demander-devis" variant="default" size="default" className="hidden shrink-0 sm:inline-flex">
              Demander un devis
            </CtaButton>
          </div>
        </div>
        <div className="flex overflow-x-auto border-t border-[var(--glass-border)] px-4 py-2 sm:px-6 md:hidden scoop-scrollbar">
          <div className="flex min-w-0 gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  pathname === link.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <CtaButton href="/demander-devis" variant="default" size="sm" className="shrink-0">
              Devis
            </CtaButton>
          </div>
        </div>
      </div>
    </header>
  )
}
