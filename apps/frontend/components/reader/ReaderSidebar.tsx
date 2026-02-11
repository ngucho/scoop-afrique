'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GlitchText, Dot, ThemeToggle } from 'scoop'
import { IconFileText, IconPlayerPlay, IconMicrophone, IconSearch, IconWorld, IconMenu, IconX } from '@tabler/icons-react'
import { READER_CATEGORIES } from '@/lib/readerCategories'
import type { Category } from '@/lib/api/types'

export { READER_CATEGORIES }

const CONTENT_TYPES = [
  { href: '/articles', label: 'Articles', icon: IconFileText },
  { href: '/video', label: 'Vidéos', icon: IconPlayerPlay },
  { href: '/podcast', label: 'Podcast', icon: IconMicrophone },
] as const

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

interface SidebarNavProps {
  categories: { slug: string; name: string }[]
  onNavigate?: () => void
}

function SidebarNav({ categories, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const fallback = READER_CATEGORIES.map((c) => ({ slug: c.slug, name: c.label }))
  const fromApi = categories.map((c) => ({ slug: c.slug, name: c.name }))
  const hasActualites = fromApi.some((c) => c.slug === 'actualites')
  const navCategories =
    fromApi.length > 0
      ? hasActualites
        ? fromApi
        : [{ slug: 'actualites', name: 'Actualités' }, ...fromApi]
      : fallback
  return (
    <>
      <nav aria-label="Catégories" className="flex flex-col gap-0.5">
        {navCategories.map((cat) => {
          const href = cat.slug === 'actualites' ? '/articles' : `/category/${cat.slug}`
          const isActive =
            pathname === href || (pathname.startsWith('/category/') && pathname === href)
          return (
            <Link
              key={cat.slug}
              href={href}
              onClick={onNavigate}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.name}
            </Link>
          )
        })}
      </nav>
      <nav aria-label="Types de contenu" className="flex flex-col gap-0.5">
        {CONTENT_TYPES.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <Link
        href="/search"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <IconSearch className="h-4 w-4 shrink-0" aria-hidden />
        Rechercher
      </Link>
    </>
  )
}

interface ReaderSidebarProps {
  categories?: Category[]
}

export function ReaderSidebar({ categories = [] }: ReaderSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <Link href="/" className="flex items-center gap-1" aria-label="Scoop Afrique accueil">
          <LogoBlock />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-foreground hover:bg-muted"
            aria-label="Ouvrir le menu"
          >
            <IconMenu className="h-6 w-6" />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-background transition-transform duration-200 ease-out md:w-64 lg:w-72 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6 p-4 pt-14 md:pt-4">
          <div className="absolute right-4 top-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-foreground hover:bg-muted"
              aria-label="Fermer le menu"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
          <div className="border-b border-border pb-4 max-md:sr-only">
            <Link href="/" className="block" aria-label="Scoop Afrique accueil">
              <LogoBlock />
            </Link>
          </div>
          <SidebarNav categories={categories} onNavigate={() => setMobileOpen(false)} />
          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
            <ThemeToggle className="max-md:sr-only" />
            <a
              href="https://www.scoop-afrique.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Retour au site vitrine
            </a>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground">
              <IconWorld className="h-3.5 w-3.5" aria-hidden />
              Édition française
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
