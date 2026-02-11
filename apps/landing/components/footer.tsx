'use client'

import Link from 'next/link'
import { GlitchText, Dot, Badge, NavLinksList, type NavLinkItem } from 'scoop'

const pageLinks: NavLinkItem[] = [
  { label: 'A Propos', href: '/a-propos' },
  { label: 'Video', href: '/video' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Contact', href: '/contact' },
  { label: 'Politique de Confidentialite', href: '/politique-de-confidentialite' },
  { label: 'Mentions Legales', href: '/mentions-legales' },
]

const socialLinks: NavLinkItem[] = [
  { label: 'TikTok', href: 'https://tiktok.com/@Scoop.Afrique', external: true },
  { label: 'Facebook', href: 'https://facebook.com/scoop.afrique', external: true },
  { label: 'Threads', href: 'https://threads.net/@Scoop.Afrique', external: true },
  { label: 'Instagram', href: 'https://instagram.com/Scoop.Afrique', external: true },
  { label: 'YouTube', href: 'https://youtube.com/@Scoop.Afrique', external: true },
]

function NextLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return <Link href={href} className={className}>{children}</Link>
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="whitespace-nowrap text-[20vw] font-black uppercase leading-none tracking-tighter text-muted/5">
          <span className="font-brasika">SCOOP</span>
          <Dot className="inline-block h-[0.28em] w-[0.28em] align-middle" />
          <span className="font-sans">AFRIQUE</span>
        </span>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4">
              <div className="flex items-center gap-1">
                <GlitchText text="SCOOP" as="h3" className="font-brasika text-3xl font-black uppercase leading-none tracking-tight text-foreground" scramble={false} />
                <Dot size="md" className="shrink-0 align-middle" />
                <GlitchText text="AFRIQUE" as="h3" className="font-sans text-3xl font-black uppercase leading-none tracking-tight text-primary" scramble={false} />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Le média digital qui décrypte<br />l&apos;Afrique autrement.
            </p>
          </div>
          <NavLinksList title="Navigation" links={pageLinks} linkComponent={NextLink} />
          <NavLinksList title="Suivez-nous" links={socialLinks} />
          <div>
            <span className="mb-4 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Contact</span>
            <div className="space-y-2 text-sm">
              <a href="mailto:Contact@scoop-afrique.com" className="block font-medium text-primary transition-colors hover:text-foreground" data-hover>
                Contact@scoop-afrique.com
              </a>
              <p className="pt-2 text-muted-foreground">Abidjan, Cote d&apos;Ivoire</p>
            </div>
            <Badge className="mt-6">
              <Dot size="sm" pulse />
              <span className="font-mono text-xs uppercase tracking-widest text-primary">Expérience immersive</span>
            </Badge>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:mt-16 sm:pt-8 md:flex-row">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {new Date().getFullYear()} Scoop Afrique — Tous droits réservés
          </p>
          <div className="flex items-center gap-6">
            <Link href="/politique-de-confidentialite" className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary">Confidentialité</Link>
            <Link href="/mentions-legales" className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary">Mentions Légales</Link>
            <div className="flex items-center gap-2">
              <Dot size="sm" pulse />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Site en construction...</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
