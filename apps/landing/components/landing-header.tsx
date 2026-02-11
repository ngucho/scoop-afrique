'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GlitchText, Dot, ThemeToggle } from 'scoop'
import { buttonDefaultClassName } from '@/lib/landing'

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Vidéo', href: '/video' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Contact', href: '/contact' },
]

export function LandingHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-0 sm:gap-0">
        {/* Single row: logo, nav (desktop), actions */}
        <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-12 lg:px-20">
          <Link href="/" className="flex shrink-0 items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <GlitchText text="SCOOP" as="span" className="font-brasika text-lg font-black uppercase leading-none tracking-tight text-foreground sm:text-xl" scramble={false} />
            <Dot size="sm" className="shrink-0 text-primary" />
            <GlitchText text="AFRIQUE" as="span" className="font-sans text-lg font-black uppercase leading-none tracking-tight text-primary sm:text-xl" scramble={false} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:text-primary ${
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link href="/contact" className={`hidden shrink-0 md:inline-flex ${buttonDefaultClassName}`}>
              Demander un devis
            </Link>
          </div>
        </div>
        {/* Mobile: nav links in same header, no extra border for single-block look */}
        <div className="flex overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          <div className="flex min-w-0 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  pathname === link.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/contact" className={`shrink-0 ${buttonDefaultClassName} px-4 py-2 text-xs`}>
              Devis
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
