'use client'

import Link from 'next/link'
import { GlitchText, Dot, NavLinksList, type NavLinkItem } from 'scoop'

const FOOTER_LINKS = {
  navigation: [
    { label: 'Accueil', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: 'Newsletter', href: '/newsletter' },
  ],
  categories: [
    { label: 'Actualités', href: '/articles' },
    { label: 'Politique', href: '/category/politique' },
    { label: 'Culture', href: '/category/culture' },
    { label: 'Sport', href: '/category/sport' },
  ],
  /** Pages institutionnelles (mêmes contenus que le landing enrichi) */
  about: [
    { label: 'À propos', href: '/a-propos' },
    { label: 'Vidéo', href: '/video' },
    { label: 'Podcast', href: '/podcast' },
    { label: 'Contact', href: '/contact' },
    { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
    { label: 'Mentions légales', href: '/mentions-legales' },
  ],
} as const

const SOCIAL: NavLinkItem[] = [
  { label: 'TikTok', href: 'https://tiktok.com/@Scoop.Afrique', external: true },
  { label: 'Facebook', href: 'https://facebook.com/scoop.afrique', external: true },
  { label: 'Instagram', href: 'https://instagram.com/Scoop.Afrique', external: true },
  { label: 'YouTube', href: 'https://youtube.com/@Scoop.Afrique', external: true },
  { label: 'Threads', href: 'https://threads.net/@Scoop.Afrique', external: true },
]

function FooterLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const style = `text-sm text-white/80 transition-colors hover:text-white ${className ?? ''}`
  const isExternal = href.startsWith('http')
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={style}>
        {children}
      </a>
    )
  }
  return <Link href={href} className={style}>{children}</Link>
}

export function ReaderFooter() {
  return (
    <footer className="relative mt-auto w-full overflow-hidden border-t border-border bg-foreground">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="whitespace-nowrap text-[18vw] font-black uppercase leading-none tracking-tighter text-white/5 md:text-[15vw]">
          <span className="font-[var(--font-scoop)]">SCOOP</span>
          <Dot className="inline-block h-[0.28em] w-[0.28em] align-middle bg-white/10" />
          <span className="font-sans">AFRIQUE</span>
        </span>
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16 lg:px-12 [&_.text-muted-foreground]:text-white/70">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-1">
              <GlitchText
                text="SCOOP"
                as="span"
                scramble={false}
                className="font-[var(--font-scoop)] text-2xl font-black uppercase leading-none tracking-tight text-white"
              />
              <Dot size="md" className="shrink-0 align-middle bg-primary" />
              <GlitchText
                text="AFRIQUE"
                as="span"
                scramble={false}
                className="font-sans text-2xl font-black uppercase leading-none tracking-tight text-primary"
              />
            </div>
            <p className="mt-3 text-sm text-white/80">
              Le média digital qui décrypte l&apos;Afrique autrement.
            </p>
            <NavLinksList title="Réseaux" links={SOCIAL} linkComponent={FooterLink} className="mt-4 space-y-2" />
          </div>
          <NavLinksList
            title="Navigation"
            links={FOOTER_LINKS.navigation.map((l) => ({ label: l.label, href: l.href }))}
            linkComponent={FooterLink}
            className="space-y-2"
          />
          <NavLinksList
            title="Catégories"
            links={FOOTER_LINKS.categories.map((l) => ({ label: l.label, href: l.href }))}
            linkComponent={FooterLink}
            className="space-y-2"
          />
          <NavLinksList
            title="À propos"
            links={[...FOOTER_LINKS.about]}
            linkComponent={FooterLink}
            className="space-y-2"
          />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="font-mono text-xs uppercase tracking-widest text-white/60">
            © {new Date().getFullYear()} Scoop Afrique — Tous droits réservés
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/politique-de-confidentialite"
              className="font-mono text-xs uppercase tracking-widest text-white/60 transition-colors hover:text-white"
            >
              Politique de confidentialité
            </Link>
            <Link
              href="/mentions-legales"
              className="font-mono text-xs uppercase tracking-widest text-white/60 transition-colors hover:text-white"
            >
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
