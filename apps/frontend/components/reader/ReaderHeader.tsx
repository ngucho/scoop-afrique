'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AnnouncementBar,
  EditorialReaderHeader,
  GlitchText,
  Dot,
  ThemeToggle,
} from 'scoop'
import type { Announcement } from '@/lib/api/types'
import type { Category } from '@/lib/api/types'
import { READER_CATEGORIES } from '@/lib/readerCategories'

function LogoBlock() {
  return (
    <div className="flex items-center gap-1">
      <GlitchText
        text="SCOOP"
        as="span"
        scramble={false}
        className="font-[var(--font-scoop)] text-lg font-black uppercase leading-none tracking-tight text-foreground md:text-xl"
      />
      <Dot size="md" className="shrink-0 align-middle" />
      <GlitchText
        text="AFRIQUE"
        as="span"
        scramble={false}
        className="font-sans text-lg font-black uppercase leading-none tracking-tight text-primary md:text-xl"
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
      searchHref="/search"
      accountHref="/account"
      rightSlot={<ThemeToggle className="hidden sm:flex" />}
      drawerFooterSlot={<ThemeToggle />}
      brandsHref="https://brands.scoop-afrique.com"
    />
  )
}
