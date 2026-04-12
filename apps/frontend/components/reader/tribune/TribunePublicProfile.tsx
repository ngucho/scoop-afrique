'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, Button, Heading } from 'scoop'
import type { ReaderContribution } from '@/lib/api/types'
import { config } from '@/lib/config'
import { TribuneNoteCard } from '@/components/reader/tribune/TribuneNoteCard'
import type { TribuneAccess } from '@/lib/tribune-access'

function normalizeContribution(c: ReaderContribution): ReaderContribution {
  return {
    ...c,
    author: c.author ?? null,
    is_anonymous: Boolean(c.is_anonymous),
  }
}

interface TribuneProfilePayload {
  profile: {
    profile_id: string
    pseudo: string | null
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  }
  counts: { followers: number; following: number }
  is_followed_by_me?: boolean
  contributions: ReaderContribution[]
  next_cursor: string | null
}

export function TribunePublicProfile({ pseudo }: { pseudo: string }) {
  const pathname = usePathname()
  const loginHref = `/reader/auth/login?returnTo=${encodeURIComponent(pathname || '/tribune')}`
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TribuneProfilePayload | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [tribuneAccess, setTribuneAccess] = useState<TribuneAccess>('anonymous')
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [followBusy, setFollowBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const base = config.apiBaseUrl.replace(/\/+$/, '')
      const res = await fetch(`${base}/api/v1/tribune/users/${encodeURIComponent(pseudo)}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        setError(res.status === 404 ? 'Profil introuvable.' : 'Erreur de chargement.')
        setData(null)
        return
      }
      const json = (await res.json()) as { data: TribuneProfilePayload }
      setData(json.data)
      setNextCursor(json.data.next_cursor)
    } catch {
      setError('Erreur réseau.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [pseudo])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    fetch('/api/reader-session')
      .then((r) => r.json())
      .then((j: { authenticated?: boolean; tribune_access?: TribuneAccess }) => {
        setAuthenticated(!!j.authenticated)
        if (j.tribune_access) setTribuneAccess(j.tribune_access)
      })
      .catch(() => {})
    fetch('/api/reader/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: { profile_id?: string } } | null) => {
        if (j?.data?.profile_id) setMyProfileId(j.data.profile_id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!authenticated || !data?.profile?.profile_id) return
    void (async () => {
      const res = await fetch('/api/reader/me/tribune/context')
      if (!res.ok) return
      const json = (await res.json()) as { data?: { following?: { profile_id: string }[] } }
      const following = json.data?.following ?? []
      const isFollow = following.some((x) => x.profile_id === data.profile.profile_id)
      setData((prev) => (prev ? { ...prev, is_followed_by_me: isFollow } : prev))
    })()
  }, [authenticated, data?.profile?.profile_id])

  const loadMore = async () => {
    if (!nextCursor || loadingMore || !data?.profile) return
    setLoadingMore(true)
    try {
      const base = config.apiBaseUrl.replace(/\/+$/, '')
      const sp = new URLSearchParams()
      sp.set('author_profile_id', data.profile.profile_id)
      sp.set('limit', '24')
      sp.set('cursor', nextCursor)
      const res = await fetch(`${base}/api/v1/contributions?${sp.toString()}`)
      if (!res.ok) return
      const json = (await res.json()) as { data?: ReaderContribution[]; next_cursor?: string | null }
      const more = (json.data ?? []).map(normalizeContribution)
      setData((prev) =>
        prev
          ? {
              ...prev,
              contributions: [...prev.contributions, ...more],
            }
          : prev,
      )
      setNextCursor(json.next_cursor ?? null)
    } finally {
      setLoadingMore(false)
    }
  }

  const toggleFollow = async () => {
    if (!data?.profile || !authenticated || !myProfileId) return
    if (data.profile.profile_id === myProfileId) return
    setFollowBusy(true)
    try {
      const method = data.is_followed_by_me ? 'DELETE' : 'POST'
      const res = await fetch(`/api/reader-bff/tribune/follow/${data.profile.profile_id}`, { method })
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                is_followed_by_me: !prev.is_followed_by_me,
                counts: {
                  ...prev.counts,
                  followers: prev.counts.followers + (prev.is_followed_by_me ? -1 : 1),
                },
              }
            : prev,
        )
      }
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) {
    return <p className="p-8 text-center text-muted-foreground">Chargement…</p>
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">{error ?? 'Profil introuvable.'}</p>
        <Link href="/tribune" className="mt-4 inline-block text-primary underline" prefetch={false}>
          Retour à la Tribune
        </Link>
      </div>
    )
  }

  const p = data.profile
  const label = p.display_name || p.pseudo || 'Profil'
  const isSelf = myProfileId === p.profile_id

  return (
    <div className="pb-24">
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/25 via-muted to-background md:h-52" />
      <div className="mx-auto max-w-3xl px-4">
        <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar
              src={p.avatar_url}
              alt={label}
              size="lg"
              className="h-28 w-28 border-4 border-background text-2xl"
              fallback={label.slice(0, 2)}
            />
            <div className="pb-1">
              <Heading as="h1" level="h1" className="text-2xl md:text-3xl">
                {label}
              </Heading>
              {p.pseudo ? <p className="text-muted-foreground">@{p.pseudo}</p> : null}
              <p className="text-sm text-muted-foreground">
                {data.counts.followers} abonnés · {data.counts.following} abonnements
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSelf ? (
              <Link href="/tribune/profile" prefetch={false}>
                <Button type="button" variant="secondary">
                  Modifier mon profil
                </Button>
              </Link>
            ) : authenticated ? (
              <Button type="button" disabled={followBusy} onClick={() => void toggleFollow()}>
                {data.is_followed_by_me ? 'Ne plus suivre' : 'Suivre · tribune perso'}
              </Button>
            ) : (
              <Link href={loginHref} prefetch={false}>
                <Button type="button" variant="secondary">
                  Connectez-vous pour suivre
                </Button>
              </Link>
            )}
          </div>
        </div>
        {p.bio ? <p className="mt-6 max-w-2xl text-[15px] leading-relaxed">{p.bio}</p> : null}

        <Heading as="h2" level="h2" className="mt-10 text-xl">
          Notes
        </Heading>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-card">
          {data.contributions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucune note publique.</p>
          ) : (
            data.contributions.map((c) => (
              <TribuneNoteCard
                key={c.id}
                c={normalizeContribution(c)}
                myProfileId={myProfileId}
                canInteract={tribuneAccess === 'reader'}
                loginHref={loginHref}
                onDelete={() => {}}
                onEdit={() => {}}
              />
            ))
          )}
        </div>
        {nextCursor ? (
          <Button type="button" variant="secondary" className="mt-4" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? 'Chargement…' : 'Charger plus'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
