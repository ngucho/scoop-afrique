'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconLayoutGrid, IconEdit, IconUser } from '@tabler/icons-react'

const dockLinkClass = (active: boolean) =>
  `flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 transition-transform active:scale-95 ${
    active ? 'scale-105 text-primary' : 'text-editorial-secondary'
  }`

export function ReaderMobileDock() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[4.5rem] items-center justify-around border-t border-editorial-outline-variant/15 bg-editorial-surface-lowest/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Navigation mobile"
    >
      <Link href="/" className={dockLinkClass(pathname === '/')} aria-current={pathname === '/' ? 'page' : undefined}>
        <IconHome className="h-6 w-6" stroke={1.75} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Accueil</span>
      </Link>
      <Link href="/articles" className={dockLinkClass(pathname.startsWith('/articles'))}>
        <IconLayoutGrid className="h-6 w-6" stroke={1.75} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Rubriques</span>
      </Link>
      <Link href="/tribune" className={dockLinkClass(pathname.startsWith('/tribune'))}>
        <IconEdit className="h-6 w-6" stroke={1.75} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Contribuer</span>
      </Link>
      <Link href="/account" className={dockLinkClass(pathname.startsWith('/account'))}>
        <IconUser className="h-6 w-6" stroke={1.75} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Profil</span>
      </Link>
    </nav>
  )
}
