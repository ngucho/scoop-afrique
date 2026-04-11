'use client'

import Link from 'next/link'
import { GlitchText, NavLinksList, type NavLinkItem } from 'scoop'
import { wwwPath } from '@/lib/site-urls'

/** Red dot between SCOOP and AFRIQUE — explicit bg-[var(--primary)] for visibility */
function LogoDot({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full bg-[var(--primary)] align-middle ${className}`.trim()}
      aria-hidden
    />
  )
}

const pageLinks: NavLinkItem[] = [
  { label: 'Lire scoop-afrique.com', href: wwwPath('/'), external: true },
  { label: 'Offres & services', href: '/services' },
  { label: 'Programmes sponsoring', href: '/programmes' },
  { label: 'Tarifs & grille 2026', href: '/tarifs' },
  { label: 'Réalisations', href: '/realisations' },
  { label: 'FAQ', href: '/faq' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Stratégie éditoriale', href: '/strategie-editoriale' },
  { label: 'Demander un devis', href: '/demander-devis' },
  { label: 'Contact', href: '/contact' },
  { label: 'Politique de confidentialité (site média)', href: wwwPath('/politique-de-confidentialite'), external: true },
  { label: 'Mentions légales (site média)', href: wwwPath('/mentions-legales'), external: true },
]

const socialLinks: NavLinkItem[] = [
  { label: 'TikTok', href: 'https://tiktok.com/@Scoop.Afrique', external: true },
  { label: 'Facebook', href: 'https://facebook.com/profile.php?id=61568464568442', external: true },
  { label: 'Threads', href: 'https://threads.net/@Scoop.Afrique', external: true },
  { label: 'Instagram', href: 'https://instagram.com/Scoop.Afrique', external: true },
  { label: 'YouTube', href: 'https://youtube.com/@Scoop.Afrique', external: true },
]

function FooterNavLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http')
  if (isExternal) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--surface-border)] bg-[var(--surface)]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="whitespace-nowrap text-[20vw] font-black uppercase leading-none tracking-tighter text-muted-foreground/5">
          <span className="font-brasika">SCOOP</span>
          <LogoDot className="h-[0.28em] w-[0.28em] min-h-2 min-w-2" />
          <span className="font-sans">AFRIQUE</span>
        </span>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:px-12 md:py-20 lg:px-20 lg:py-28">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-2 md:gap-16 lg:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-1">
                <GlitchText text="SCOOP" as="h3" className="font-brasika text-xl font-black uppercase leading-none tracking-tight text-foreground sm:text-2xl md:text-3xl" scramble={false} />
                <LogoDot className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3" />
                <GlitchText text="AFRIQUE" as="h3" className="font-sans text-xl font-black uppercase leading-none tracking-tight text-primary sm:text-2xl md:text-3xl" scramble={false} />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground sm:mt-4 sm:text-sm">
              Partenariats marques &amp; institutions : contenus natifs, couvertures terrain, programmes récurrents — audience
              jeune afro-francophone.
            </p>
          </div>
          <NavLinksList title="Navigation" links={pageLinks} linkComponent={FooterNavLink} />
          <NavLinksList title="Suivez-nous" links={socialLinks} />
          <div>
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">Contact</span>
            <div className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
              <a href="mailto:contact@scoop-afrique.com" className="block font-medium text-primary transition-colors hover:text-foreground" data-hover>
                contact@scoop-afrique.com
              </a>
              <a
                href="https://wa.me/2250702907949"
                className="block pt-1 font-medium text-primary transition-colors hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp +225 07 02 907 949
              </a>
              <p className="pt-1 text-muted-foreground sm:pt-2">Abidjan, Cocody Riviera Faya — Côte d&apos;Ivoire</p>
              <p className="text-[10px] text-muted-foreground sm:text-xs">RCCM CI-ABJ-03-2025-B12058-06</p>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--surface-border)] pt-6 text-center sm:mt-12 sm:gap-6 sm:pt-8 md:flex-row md:text-left">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
            © {new Date().getFullYear()} SCOOP AFRIQUE SARL — Tous droits réservés
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href={wwwPath('/politique-de-confidentialite')}
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary sm:text-xs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Confidentialité
            </a>
            <a
              href={wwwPath('/mentions-legales')}
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary sm:text-xs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
