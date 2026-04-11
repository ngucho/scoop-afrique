'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PenLine } from 'lucide-react'
import {
  EditorialSignalHero,
  EditorialFilterTabs,
  ContributionCard,
  EditorialStickyPanel,
  SegmentedToggle,
  Input,
  Textarea,
  Button,
  Label,
} from 'scoop'
import type { ReaderContribution } from '@/lib/api/types'
import { config } from '@/lib/config'
import { formatDate } from '@/lib/formatDate'

interface TribuneHubProps {
  initialContributions: ReaderContribution[]
  initialTotal: number
}

export function TribuneHub({ initialContributions, initialTotal }: TribuneHubProps) {
  const pathname = usePathname()
  const [list, setList] = useState(initialContributions)
  const [total, setTotal] = useState(initialTotal)
  const [authenticated, setAuthenticated] = useState(false)
  const [kind, setKind] = useState<'writing' | 'event'>('writing')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventStartsAt, setEventStartsAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'writing' | 'event'>('all')
  const skipNextReload = useRef(true)

  const reload = useCallback(async () => {
    try {
      const sp = new URLSearchParams()
      if (filter !== 'all') sp.set('kind', filter)
      sp.set('limit', '24')
      const res = await fetch(`${config.apiBaseUrl}/api/v1/contributions?${sp.toString()}`)
      if (!res.ok) return
      const json = (await res.json()) as { data: ReaderContribution[]; total: number }
      setList(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      // ignore
    }
  }, [filter])

  useEffect(() => {
    if (skipNextReload.current) {
      skipNextReload.current = false
      return
    }
    void reload()
  }, [reload, filter])

  useEffect(() => {
    fetch('/api/reader-session')
      .then((r) => r.json())
      .then((j: { authenticated?: boolean }) => setAuthenticated(!!j.authenticated))
      .catch(() => {})
  }, [])

  const submit = async () => {
    if (!title.trim() || !body.trim() || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      const payload: Record<string, unknown> = {
        kind,
        title: title.trim(),
        body: body.trim(),
      }
      if (kind === 'event') {
        payload.event_location = eventLocation.trim() || null
        if (eventStartsAt) {
          const d = new Date(eventStartsAt)
          if (!Number.isNaN(d.getTime())) payload.event_starts_at = d.toISOString()
        }
      }
      const res = await fetch('/api/reader-bff/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; details?: unknown }
      if (!res.ok) {
        setMessage(json.error ?? 'Envoi impossible.')
        return
      }
      setTitle('')
      setBody('')
      setEventLocation('')
      setEventStartsAt('')
      setMessage(
        kind === 'event'
          ? 'Merci. Votre événement est soumis à modération.'
          : 'Merci. Votre tribune est soumise à modération.',
      )
      await reload()
    } catch {
      setMessage('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  const filterTabs = [
    { id: 'all', label: 'Tout', active: filter === 'all', onSelect: () => setFilter('all') },
    { id: 'writing', label: 'Analyses', active: filter === 'writing', onSelect: () => setFilter('writing') },
    { id: 'event', label: 'Événements', active: filter === 'event', onSelect: () => setFilter('event') },
  ]

  const loginHref = `/reader/auth/login?returnTo=${encodeURIComponent(pathname || '/tribune')}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <EditorialSignalHero
        eyebrow="Tribune libre"
        heading="Contribuez à la conversation"
        description={
          <p>
            Publiez vos analyses ou signalez un événement pertinent pour la communauté panafricaine — publication
            après validation par la rédaction.
          </p>
        }
        actions={
          !authenticated ? (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-primary shadow-md transition-transform active:scale-95"
              prefetch={false}
            >
              <PenLine className="h-5 w-5" aria-hidden />
              Se connecter pour écrire
            </Link>
          ) : null
        }
      />

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2
              className="border-l-4 border-primary pl-4 text-2xl font-bold md:text-3xl"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Dernières contributions
            </h2>
            <EditorialFilterTabs tabs={filterTabs} />
          </div>

          {list.length === 0 ? (
            <p className="text-muted-foreground">Aucune contribution publiée pour le moment.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {list.map((c) => (
                <ContributionCard
                  key={c.id}
                  kindLabel={c.kind === 'event' ? 'Événement' : 'Analyse'}
                  heading={c.title}
                  excerpt={c.body}
                  meta={
                    c.kind === 'event' && (c.event_location || c.event_starts_at) ? (
                      <>
                        {c.event_location ? `${c.event_location}` : ''}
                        {c.event_starts_at ? ` · ${formatDate(c.event_starts_at)}` : ''}
                      </>
                    ) : null
                  }
                  footer={`${c.author?.email?.split('@')[0] ?? 'Lecteur'} · ${formatDate(c.created_at)}`}
                />
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{total} publication(s) au total (filtre appliqué).</p>
        </div>

        <EditorialStickyPanel
          heading={
            <>
              <PenLine className="h-6 w-6 text-primary" aria-hidden />
              Nouveau envoi
            </>
          }
        >
          {!authenticated ? (
            <p className="text-sm text-muted-foreground">
              <Link href={loginHref} className="font-semibold text-primary underline" prefetch={false}>
                Connectez-vous
              </Link>{' '}
              pour proposer une analyse ou un événement.
            </p>
          ) : (
            <div className="space-y-4">
              <SegmentedToggle
                options={[
                  { id: 'writing', label: 'Tribune', active: kind === 'writing', onSelect: () => setKind('writing') },
                  { id: 'event', label: 'Événement', active: kind === 'event', onSelect: () => setKind('event') },
                ]}
              />
              <div className="space-y-1">
                <Label size="sm" className="uppercase tracking-wide text-muted-foreground">
                  Titre
                </Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label size="sm" className="uppercase tracking-wide text-muted-foreground">
                  {kind === 'event' ? 'Description' : 'Texte'}
                </Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="min-h-[8rem] rounded-xl"
                />
              </div>
              {kind === 'event' ? (
                <>
                  <div className="space-y-1">
                    <Label size="sm" className="uppercase tracking-wide text-muted-foreground">
                      Lieu
                    </Label>
                    <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label size="sm" className="uppercase tracking-wide text-muted-foreground">
                      Date / heure de début
                    </Label>
                    <Input
                      type="datetime-local"
                      value={eventStartsAt}
                      onChange={(e) => setEventStartsAt(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </>
              ) : null}
              <Button
                type="button"
                className="w-full uppercase tracking-widest"
                onClick={() => void submit()}
                disabled={submitting}
              >
                {submitting ? 'Envoi…' : 'Envoyer'}
              </Button>
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </div>
          )}
        </EditorialStickyPanel>
      </div>
    </div>
  )
}
