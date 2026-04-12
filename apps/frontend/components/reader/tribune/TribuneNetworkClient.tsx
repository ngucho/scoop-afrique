'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, SegmentedToggle } from 'scoop'
import type { TribuneFollowListRow } from '@/lib/api/types'

export function TribuneNetworkClient() {
  const pathname = usePathname()
  const loginHref = `/reader/auth/login?returnTo=${encodeURIComponent(pathname || '/tribune/network')}`
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'followers' | 'following'>('followers')
  const [followers, setFollowers] = useState<TribuneFollowListRow[]>([])
  const [following, setFollowing] = useState<TribuneFollowListRow[]>([])

  const load = useCallback(async () => {
    const sessionRes = await fetch('/api/reader-session')
    const session = (await sessionRes.json()) as { authenticated?: boolean }
    setAuthenticated(!!session.authenticated)
    if (!session.authenticated) {
      setLoading(false)
      return
    }
    const res = await fetch('/api/reader/me/tribune/context')
    if (!res.ok) {
      setLoading(false)
      return
    }
    const json = (await res.json()) as {
      data?: { followers?: TribuneFollowListRow[]; following?: TribuneFollowListRow[] }
    }
    setFollowers(json.data?.followers ?? [])
    setFollowing(json.data?.following ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="p-8 text-center text-muted-foreground">Chargement…</p>
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted-foreground">Connectez-vous pour voir votre réseau Tribune.</p>
        <Link href={loginHref} className="font-medium text-primary underline" prefetch={false}>
          Connexion
        </Link>
      </div>
    )
  }

  const list = tab === 'followers' ? followers : following
  const empty =
    tab === 'followers'
      ? 'Personne ne vous suit encore dans votre tribune personnelle.'
      : 'Vous ne suivez encore personne.'

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-headline)' }}>
        Réseau Tribune
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        <Link href="/tribune/profile" className="text-primary underline" prefetch={false}>
          Mon profil
        </Link>
        {' · '}
        <Link href="/tribune" className="text-primary underline" prefetch={false}>
          Fil
        </Link>
      </p>

      <SegmentedToggle
        options={[
          {
            id: 'followers',
            label: `Abonnés (${followers.length})`,
            active: tab === 'followers',
            onSelect: () => setTab('followers'),
          },
          {
            id: 'following',
            label: `Abonnements (${following.length})`,
            active: tab === 'following',
            onSelect: () => setTab('following'),
          },
        ]}
      />

      <ul className="mt-6 space-y-2">
        {list.length === 0 ? (
          <li className="rounded-xl border border-border/80 bg-card px-4 py-6 text-sm text-muted-foreground">{empty}</li>
        ) : (
          list.map((u) => {
            const href = u.pseudo ? `/tribune/u/${encodeURIComponent(u.pseudo)}` : null
            const label = u.display_name || u.pseudo || 'Profil'
            return (
              <li key={`${tab}-${u.profile_id}`}>
                <Link
                  href={href ?? '#'}
                  className={`flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 transition-colors hover:bg-muted/30 ${!href ? 'pointer-events-none opacity-70' : ''}`}
                  prefetch={false}
                >
                  <Avatar src={u.avatar_url} alt={label} fallback={label.slice(0, 2)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{label}</p>
                    {u.pseudo ? <p className="text-sm text-muted-foreground">@{u.pseudo}</p> : null}
                  </div>
                </Link>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
