'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandsMarketingHeader, ThemeToggle, CtaLink } from 'scoop'
import { BrandsLogo } from '@/components/brands-logo'

const NAV = [
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
  const navItems = NAV.map((link) => ({
    ...link,
    active: pathname === link.href,
  }))

  return (
    <BrandsMarketingHeader
      Link={Link}
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
