'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandsMarketingHeader, ThemeToggle, CtaLink, type BrandsHeaderLinkProps } from 'scoop'
import { BrandsLogo } from '@/components/brands-logo'
import { wwwPath } from '@/lib/site-urls'

const READER_HOME = wwwPath('/')

const NAV = [
  { label: 'Accueil', href: '/' },
  { label: 'Lire le média', href: READER_HOME },
  { label: 'Offres', href: '/services' },
  { label: 'Programmes', href: '/programmes' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Réalisations', href: '/realisations' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

function getBackLink(pathname: string): { href: string; label: string } | null {
  if (pathname === '/') return null
  if (pathname.startsWith('/services/')) return { href: '/services', label: 'Retour aux offres' }
  if (pathname.startsWith('/programmes/')) return { href: '/programmes', label: 'Retour aux programmes' }
  if (pathname === '/strategie-editoriale') return { href: '/a-propos', label: "Retour à l'À propos" }
  return { href: '/', label: "Retour à l'accueil" }
}

export function BrandsHeader() {
  const pathname = usePathname()
  const backLink = getBackLink(pathname)
  const navItems = NAV.map((link) => ({
    ...link,
    active:
      pathname === link.href ||
      (link.href === '/services' && pathname.startsWith('/services')) ||
      (link.href === '/programmes' && pathname.startsWith('/programmes')),
  }))

  function LinkWithExternal({ href, prefetch: _prefetch, className, children, ...rest }: BrandsHeaderLinkProps) {
    if (href.startsWith('http')) {
      return (
        <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={className} prefetch={false} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <BrandsMarketingHeader
      Link={LinkWithExternal}
      logo={<BrandsLogo />}
      backLink={backLink}
      navItems={navItems}
      rightSlot={
        <>
          <ThemeToggle />
          <CtaLink
            Link={Link}
            href="/demander-devis"
            variant="default"
            size="default"
            className="hidden shrink-0 sm:inline-flex"
          >
            Demander un devis
          </CtaLink>
        </>
      }
      mobileTrailing={
        <CtaLink Link={Link} href="/demander-devis" variant="default" size="sm" className="shrink-0">
          Devis
        </CtaLink>
      }
    />
  )
}
