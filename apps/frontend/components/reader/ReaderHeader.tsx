'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AnnouncementBar,
  EditorialReaderHeader,
  GlitchText,
  Dot,
  ThemeToggle,
  cn,
} from 'scoop'
import type { Announcement } from '@/lib/api/types'
import type { Category } from '@/lib/api/types'
import { READER_CATEGORIES } from '@/lib/readerCategories'
import { TribuneSecondaryNav } from '@/components/reader/TribuneSecondaryNav'

function LogoBlock() {
  return (
    <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
      <GlitchText
        text="SCOOP"
        as="span"
        scramble={false}
        className="font-[var(--font-scoop)] text-base font-black uppercase leading-none tracking-tight text-foreground sm:text-lg md:text-xl"
      />
      <Dot size="md" className="shrink-0 align-middle max-sm:scale-90" />
      <GlitchText
        text="AFRIQUE"
        as="span"
        scramble={false}
        className="font-sans text-base font-black uppercase leading-none tracking-tight text-primary sm:text-lg md:text-xl"
      />
    </div>
  )
}

export interface ReaderHeaderProps {
  bannerAnnouncement: Announcement | null
  urgentBar?: boolean
  categories: Category[]
}

export function ReaderHeader({ bannerAnnouncement, urgentBar, categories }: ReaderHeaderProps) {
  const pathname = usePathname()
  const isTribune = pathname.startsWith('/tribune')

  const fromApi = categories.map((c) => ({ slug: c.slug, name: c.name }))
  const hasActualites = fromApi.some((c) => c.slug === 'actualites')
  const navCategories =
    fromApi.length > 0
      ? hasActualites
        ? fromApi
        : [{ slug: 'actualites', name: 'Actualités' }, ...fromApi]
      : READER_CATEGORIES.map((c) => ({ slug: c.slug, name: c.label }))

  const barVariant = urgentBar && bannerAnnouncement ? 'signal' : 'default'

  const mainNav = [
    { href: '/', label: 'Accueil', active: pathname === '/' },
    { href: '/articles', label: 'Articles', active: pathname.startsWith('/articles') },
    { href: '/tribune', label: 'Tribune', active: pathname.startsWith('/tribune') },
    { href: '/video', label: 'Vidéos', active: pathname.startsWith('/video') },
    { href: '/podcast', label: 'Podcast', active: pathname.startsWith('/podcast') },
  ]

  const categoryNav = navCategories.map((cat) => {
    const href = cat.slug === 'actualites' ? '/articles' : `/category/${cat.slug}`
    const active = pathname === href || (pathname.startsWith('/category/') && pathname === href)
    return { href, label: cat.name, active }
  })

  const drawerLinkClass = 'rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted'

  const banner =
    bannerAnnouncement ? (
      <AnnouncementBar variant={barVariant} className="relative z-[60]">
        <span className="max-w-5xl">
          {bannerAnnouncement.link_url ? (
            <Link href={bannerAnnouncement.link_url} className="underline underline-offset-2 hover:opacity-90">
              {bannerAnnouncement.title}
            </Link>
          ) : (
            bannerAnnouncement.title
          )}
          {bannerAnnouncement.body ? (
            <span className="mt-1 block text-xs font-normal opacity-90 md:inline md:mt-0 md:before:content-['—_']">
              {bannerAnnouncement.body}
            </span>
          ) : null}
        </span>
      </AnnouncementBar>
    ) : undefined

  return (
    <EditorialReaderHeader
      banner={banner}
      Link={Link}
      logo={<LogoBlock />}
      logoHref="/"
      mainNav={mainNav}
      categoryNav={categoryNav}
      secondaryNav={isTribune ? <TribuneSecondaryNav /> : undefined}
      searchHref="/search"
      accountHref="/account"
      rightSlot={
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <a
            href="https://brands.scoop-afrique.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20'
            )}
          >
            Annonceurs
          </a>
        </div>
      }
      drawerFooterSlot={<ThemeToggle />}
      mobileDrawerExtra={
        isTribune ? (
          <>
            <div className="my-2 border-t border-border pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Accès Tribune
            </div>
            <Link href="/tribune" className={drawerLinkClass} prefetch={false}>
              Fil
            </Link>
            <Link href="/tribune/profile" className={drawerLinkClass} prefetch={false}>
              Mon profil
            </Link>
            <Link href="/tribune/network" className={drawerLinkClass} prefetch={false}>
              Réseau
            </Link>
          </>
        ) : null
      }
      brandsHref="https://brands.scoop-afrique.com"
    />
  )
}
