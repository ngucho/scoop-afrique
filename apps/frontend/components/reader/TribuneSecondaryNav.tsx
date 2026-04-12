'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Users } from 'lucide-react'
import { Avatar, cn } from 'scoop'

type MePayload = {
  profile?: { pseudo: string | null; display_name: string | null; avatar_url: string | null } | null
}

export function TribuneSecondaryNav() {
  const pathname = usePathname()
  const [picture, setPicture] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [pseudo, setPseudo] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    fetch('/api/reader-session')
      .then((r) => r.json())
      .then((j: { authenticated?: boolean; user?: { picture?: string; name?: string } }) => {
        setAuthenticated(!!j.authenticated)
        setPicture(j.user?.picture ?? null)
        setName(j.user?.name ?? null)
      })
      .catch(() => {})

    fetch('/api/reader/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: MePayload } | null) => {
        const p = j?.data?.profile
        if (p?.pseudo) setPseudo(p.pseudo)
        if (p?.display_name) setName((n) => p.display_name ?? n)
        if (p?.avatar_url) setPicture((prev) => p?.avatar_url ?? prev)
      })
      .catch(() => {})
  }, [])

  const profileHref = pseudo ? `/tribune/u/${encodeURIComponent(pseudo)}` : '/tribune/profile'
  const profileLabel = name || pseudo || 'Profil'

  const pill = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors',
      active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
    )

  return (
    <nav
      className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 sm:gap-3"
      aria-label="Navigation Tribune"
    >
      {authenticated ? (
        <Link
          href={profileHref}
          className={cn(
            'order-first inline-flex max-w-[min(100%,14rem)] items-center gap-2 rounded-full border border-border/80 bg-muted/30 px-2 py-1 pr-3 text-left transition-colors hover:bg-muted/50 sm:order-none',
            pathname.startsWith('/tribune/profile') || pathname.startsWith('/tribune/u/')
              ? 'border-primary/40 bg-primary/10'
              : '',
          )}
          prefetch={false}
          title="Mon profil Tribune"
        >
          <Avatar src={picture} alt="" size="sm" fallback={profileLabel.slice(0, 2)} />
          <span className="truncate text-xs font-semibold normal-case tracking-normal">{profileLabel}</span>
        </Link>
      ) : (
        <Link
          href={`/reader/auth/login?returnTo=${encodeURIComponent('/tribune/profile')}`}
          className="order-first inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:border-primary/40 hover:text-primary sm:order-none"
          prefetch={false}
        >
          Profil
        </Link>
      )}

      <Link href="/tribune" className={pill(pathname === '/tribune')} prefetch={false}>
        <Home className="h-3.5 w-3.5" aria-hidden />
        Fil
      </Link>

      <Link
        href="/tribune/network"
        className={pill(pathname.startsWith('/tribune/network'))}
        prefetch={false}
      >
        <Users className="h-3.5 w-3.5" aria-hidden />
        Réseau
      </Link>

      <span
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60"
        title="Bientôt"
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden />
        Messages
      </span>
    </nav>
  )
}
