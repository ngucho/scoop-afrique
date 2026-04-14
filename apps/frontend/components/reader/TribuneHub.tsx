'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PenLine } from 'lucide-react'
import { EditorialSignalHero, EditorialFilterTabs, SegmentedToggle, Button } from 'scoop'
import type { ReaderContribution } from '@/lib/api/types'
import { config } from '@/lib/config'
import { TribuneComposeModal } from '@/components/reader/tribune/TribuneComposeModal'
import { TribuneComposerBar } from '@/components/reader/tribune/TribuneComposerBar'
import { TribuneFAB } from '@/components/reader/tribune/TribuneFAB'
import { TribuneNoteCard } from '@/components/reader/tribune/TribuneNoteCard'
import type { TribuneAccess } from '@/lib/tribune-access'

interface TribuneHubProps {
  initialContributions: ReaderContribution[]
  initialNextCursor: string | null
  /** Déduit côté serveur pour éviter le flash du hero « Contribuez » si déjà connecté lecteur. */
  initialTribuneAccess: TribuneAccess
  initialAuthenticated: boolean
}

function normalizeContribution(c: ReaderContribution): ReaderContribution {
  return {
    ...c,
    author: c.author ?? null,
    is_anonymous: Boolean(c.is_anonymous),
  }
}

export function TribuneHub({
  initialContributions,
  initialNextCursor,
  initialTribuneAccess,
  initialAuthenticated,
}: TribuneHubProps) {
  const pathname = usePathname()
  const [list, setList] = useState(() => initialContributions.map(normalizeContribution))
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sort, setSort] = useState<'latest' | 'trending'>('latest')
  const [authenticated, setAuthenticated] = useState(() => initialAuthenticated)
  const [tribuneAccess, setTribuneAccess] = useState<TribuneAccess>(initialTribuneAccess)
  const [sessionPicture, setSessionPicture] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'writing' | 'event'>('all')
  const skipNextReload = useRef(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ReaderContribution | null>(null)

  const reload = useCallback(async () => {
    try {
      const sp = new URLSearchParams()
      if (filter !== 'all') sp.set('kind', filter)
      sp.set('limit', '24')
      sp.set('sort', sort)
      const res = await fetch(`${config.apiBaseUrl}/api/v1/contributions?${sp.toString()}`)
      if (!res.ok) return
      const json = (await res.json()) as {
        data: ReaderContribution[]
        next_cursor?: string | null
      }
      setList((json.data ?? []).map(normalizeContribution))
      setNextCursor(json.next_cursor ?? null)
    } catch {
      // ignore
    }
  }, [filter, sort])

  useEffect(() => {
    if (skipNextReload.current) {
      skipNextReload.current = false
      return
    }
    void reload()
  }, [reload, filter, sort])

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (!hash.startsWith('#tribune-contribution-')) return
    const raw = hash.slice('#tribune-contribution-'.length)
    if (!raw) return
    const el = document.getElementById(`tribune-contribution-${raw}`)
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [list, pathname])

  useEffect(() => {
    fetch('/api/reader-session')
      .then((r) => r.json())
      .then(
        (j: {
          authenticated?: boolean
          tribune_access?: TribuneAccess
          user?: { picture?: string; name?: string }
        }) => {
          setAuthenticated(!!j.authenticated)
          if (j.tribune_access) setTribuneAccess(j.tribune_access)
          setSessionPicture(j.user?.picture ?? null)
          setSessionName(j.user?.name ?? null)
        },
      )
      .catch(() => {})

    fetch('/api/reader/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: { profile_id?: string } } | null) => {
        if (j?.data?.profile_id) setMyProfileId(j.data.profile_id)
        else setMyProfileId(null)
      })
      .catch(() => setMyProfileId(null))
  }, [])

  const loadMore = async () => {
    if (!nextCursor || loadingMore || sort === 'trending') return
    setLoadingMore(true)
    try {
      const sp = new URLSearchParams()
      if (filter !== 'all') sp.set('kind', filter)
      sp.set('limit', '24')
      sp.set('sort', sort)
      sp.set('cursor', nextCursor)
      const res = await fetch(`${config.apiBaseUrl}/api/v1/contributions?${sp.toString()}`)
      if (!res.ok) return
      const json = (await res.json()) as {
        data: ReaderContribution[]
        next_cursor?: string | null
      }
      const more = (json.data ?? []).map(normalizeContribution)
      setList((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        const merged = [...prev]
        for (const item of more) {
          if (!seen.has(item.id)) {
            seen.add(item.id)
            merged.push(item)
          }
        }
        return merged
      })
      setNextCursor(json.next_cursor ?? null)
    } finally {
      setLoadingMore(false)
    }
  }

  const filterTabs = [
    { id: 'all', label: 'Tout', active: filter === 'all', onSelect: () => setFilter('all') },
    { id: 'writing', label: 'Tribune', active: filter === 'writing', onSelect: () => setFilter('writing') },
    { id: 'event', label: 'Événements', active: filter === 'event', onSelect: () => setFilter('event') },
  ]

  const loginHref = `/reader/auth/login?returnTo=${encodeURIComponent(pathname || '/tribune')}`
  const canContribute = tribuneAccess === 'reader'

  const openCompose = () => {
    setEditTarget(null)
    setComposeOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
      {tribuneAccess === 'anonymous' ? (
        <EditorialSignalHero
          eyebrow="Tribune libre"
          heading="Contribuez à la conversation"
          description={
            <p>
              Le réseau d&apos;information encadré par la rédaction : analyses, événements, débats — avec la source
              journalistique à portée de main. Publiez en votre nom ou en anonyme.
            </p>
          }
          actions={
            <div className="flex flex-wrap gap-3">
              <Link
                href={loginHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary shadow-md transition-transform active:scale-95"
                prefetch={false}
              >
                <PenLine className="h-5 w-5" aria-hidden />
                Se connecter pour participer
              </Link>
              <Link
                href="/tribune/profile"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                prefetch={false}
              >
                Découvrir les profils
              </Link>
            </div>
          }
        />
      ) : null}

      {tribuneAccess === 'staff_only' ? (
        <div className="mb-6 rounded-2xl border border-amber-500/35 bg-amber-500/[0.07] px-4 py-4 text-sm text-foreground shadow-sm">
          <p className="leading-relaxed">
            Vous êtes connecté avec un <strong>compte rédaction</strong>. Pour publier ou réagir sur la Tribune,
            connectez-vous avec votre <strong>compte lecteur</strong> (celui de l’app ou de l’abonnement). L’espace
            rédaction, c’est par ici :
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              prefetch={false}
            >
              Espace rédaction
            </Link>
            <Link
              href={loginHref}
              className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold"
              prefetch={false}
            >
              Me connecter en lecteur
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mx-auto mt-4 max-w-xl lg:max-w-2xl">
        <TribuneComposerBar
          picture={sessionPicture}
          displayName={sessionName}
          authenticated={authenticated}
          canContribute={canContribute}
          tribuneAccess={tribuneAccess}
          onOpenCompose={openCompose}
          loginHref={loginHref}
        />

        {authenticated && canContribute ? (
          <p className="mb-4 text-center text-xs text-muted-foreground sm:text-left">
            Tribune — réseau social de l&apos;information : discutez, réagissez, suivez les voix de la communauté et
            les journalistes Scoop.Afrique.
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
            Fil
          </h2>
          <div className="flex flex-col gap-2 sm:items-end">
            <SegmentedToggle
              options={[
                { id: 'latest', label: 'Récent', active: sort === 'latest', onSelect: () => setSort('latest') },
                {
                  id: 'trending',
                  label: 'Tendance',
                  active: sort === 'trending',
                  onSelect: () => setSort('trending'),
                },
              ]}
            />
            <EditorialFilterTabs tabs={filterTabs} />
          </div>
        </div>

        <div className="mt-2 overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] backdrop-blur-sm dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
          {list.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucune note pour le moment.</p>
          ) : (
            list.map((c) => (
              <TribuneNoteCard
                key={c.id}
                c={c}
                myProfileId={myProfileId}
                canInteract={canContribute}
                loginHref={loginHref}
                onDelete={(id) => {
                  setList((prev) => prev.filter((p) => p.id !== id))
                }}
                onEdit={(row) => {
                  setEditTarget(row)
                  setComposeOpen(true)
                }}
              />
            ))
          )}
        </div>

        {sort === 'latest' && nextCursor ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full sm:w-auto"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? 'Chargement…' : 'Charger plus'}
          </Button>
        ) : null}
        {sort === 'trending' ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Classement par score sur la page courante — passez en « Récent » pour le chargement infini.
          </p>
        ) : null}
      </div>

      <TribuneComposeModal
        open={composeOpen}
        onOpenChange={(o) => {
          setComposeOpen(o)
          if (!o) setEditTarget(null)
        }}
        editContribution={editTarget}
        onPosted={() => void reload()}
      />

      <TribuneFAB visible={canContribute} onClick={openCompose} />
    </div>
  )
}
