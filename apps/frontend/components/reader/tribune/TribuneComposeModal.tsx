'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Dialog,
  Input,
  Label,
  Textarea,
  SegmentedToggle,
} from 'scoop'
import type { Article } from '@/lib/api/types'
import type { ReaderContribution } from '@/lib/api/types'
import { config } from '@/lib/config'
import { extractSlugFromArticleUrl, looksLikeArticleId } from '@/lib/tribune-article'

type Step = 'kind' | 'form'

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchArticleByRef(raw: string): Promise<Article | null> {
  const base = config.apiBaseUrl.replace(/\/+$/, '')
  const q = raw.trim()
  if (!q) return null
  if (looksLikeArticleId(q)) {
    const res = await fetch(`${base}/api/v1/articles/${encodeURIComponent(q)}`)
    if (!res.ok) return null
    const json = (await res.json()) as { data?: Article }
    return json.data ?? null
  }
  const slug = extractSlugFromArticleUrl(q)
  if (slug) {
    const res = await fetch(`${base}/api/v1/articles/${encodeURIComponent(slug)}`)
    if (!res.ok) return null
    const json = (await res.json()) as { data?: Article }
    return json.data ?? null
  }
  return null
}

export interface TribuneComposeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPosted: () => void
  editContribution?: ReaderContribution | null
}

export function TribuneComposeModal({
  open,
  onOpenChange,
  onPosted,
  editContribution,
}: TribuneComposeModalProps) {
  const isEdit = Boolean(editContribution?.id)
  const [step, setStep] = useState<Step>(isEdit ? 'form' : 'kind')
  const [kind, setKind] = useState<'writing' | 'event'>('writing')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [articleQuery, setArticleQuery] = useState('')
  const debouncedArticleQuery = useDebounced(articleQuery, 320)
  const [articlePage, setArticlePage] = useState(1)
  const prevArticleSearchRef = useRef('')
  const [articleResults, setArticleResults] = useState<Article[]>([])
  const [articleTotal, setArticleTotal] = useState(0)
  const [articleLoading, setArticleLoading] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [eventLocation, setEventLocation] = useState('')
  const [eventStartsAt, setEventStartsAt] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep(isEdit ? 'form' : 'kind')
    setKind('writing')
    setTitle('')
    setBody('')
    setArticleQuery('')
    setArticlePage(1)
    prevArticleSearchRef.current = ''
    setArticleResults([])
    setArticleTotal(0)
    setSelectedArticle(null)
    setEventLocation('')
    setEventStartsAt('')
    setIsAnonymous(false)
    setMessage(null)
  }, [isEdit])

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    if (editContribution) {
      setStep('form')
      setKind(editContribution.kind)
      setTitle(editContribution.title)
      setBody(editContribution.body)
      setEventLocation(editContribution.event_location ?? '')
      setEventStartsAt(isoToDatetimeLocal(editContribution.event_starts_at))
      setIsAnonymous(Boolean(editContribution.is_anonymous))
      setSelectedArticle(null)
      setArticleQuery('')
      if (editContribution.article_id) {
        void (async () => {
          const a = await fetchArticleByRef(editContribution.article_id!)
          if (a) setSelectedArticle(a)
        })()
      }
    }
  }, [open, editContribution, reset])

  useEffect(() => {
    if (!open || kind !== 'writing') return
    const q = debouncedArticleQuery.trim()
    if (q.length < 2 && !looksLikeArticleId(q)) {
      setArticleResults([])
      setArticleTotal(0)
      prevArticleSearchRef.current = debouncedArticleQuery
      return
    }

    const searchChanged = prevArticleSearchRef.current !== debouncedArticleQuery
    prevArticleSearchRef.current = debouncedArticleQuery
    if (searchChanged && articlePage !== 1) {
      setArticlePage(1)
      return
    }

    let cancelled = false
    setArticleLoading(true)
    const base = config.apiBaseUrl.replace(/\/+$/, '')
    const run = async () => {
      if (looksLikeArticleId(q) || extractSlugFromArticleUrl(q)) {
        const one = await fetchArticleByRef(q)
        if (!cancelled) {
          setArticleResults(one ? [one] : [])
          setArticleTotal(one ? 1 : 0)
          setArticleLoading(false)
        }
        return
      }
      const sp = new URLSearchParams()
      sp.set('q', q)
      sp.set('limit', '5')
      sp.set('page', String(articlePage))
      const res = await fetch(`${base}/api/v1/articles?${sp.toString()}`)
      const json = (await res.json()) as { data?: Article[]; total?: number }
      if (!cancelled) {
        const data = json.data ?? []
        const total = json.total ?? 0
        if (articlePage === 1) {
          setArticleResults(data)
        } else {
          setArticleResults((prev) => {
            const seen = new Set(prev.map((a) => a.id))
            const merged = [...prev]
            for (const a of data) {
              if (!seen.has(a.id)) {
                seen.add(a.id)
                merged.push(a)
              }
            }
            return merged
          })
        }
        setArticleTotal(total)
        setArticleLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [open, kind, debouncedArticleQuery, articlePage])

  const canLoadMore = useMemo(() => {
    if (articleTotal <= 0) return false
    return articleResults.length < articleTotal
  }, [articleResults.length, articleTotal])

  const submit = async () => {
    if (!title.trim() || !body.trim() || submitting) return
    setSubmitting(true)
    setMessage(null)
    try {
      const payload: Record<string, unknown> = {
        kind,
        title: title.trim(),
        body: body.trim(),
        is_anonymous: isAnonymous,
      }
      if (kind === 'writing') {
        payload.article_id = selectedArticle?.id ?? null
      } else {
        payload.event_location = eventLocation.trim() || null
        if (eventStartsAt) {
          const d = new Date(eventStartsAt)
          if (!Number.isNaN(d.getTime())) payload.event_starts_at = d.toISOString()
        } else {
          payload.event_starts_at = null
        }
      }

      const url = isEdit
        ? `/api/reader-bff/contributions/${editContribution!.id}`
        : '/api/reader-bff/contributions'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setMessage(json.error ?? 'Envoi impossible.')
        return
      }
      onPosted()
      onOpenChange(false)
      reset()
    } catch {
      setMessage('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  const dialogTitle = isEdit ? 'Modifier la note' : 'Nouvelle note'

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
      title={dialogTitle}
      className="max-h-[90vh] max-w-lg overflow-y-auto"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Publier en anonyme
          </label>
          <div className="flex gap-2">
            {step === 'form' && !isEdit ? (
              <Button type="button" variant="secondary" onClick={() => setStep('kind')}>
                Retour
              </Button>
            ) : null}
            <Button type="button" onClick={() => void submit()} disabled={submitting}>
              {submitting ? 'Envoi…' : isEdit ? 'Enregistrer' : 'Publier'}
            </Button>
          </div>
        </div>
      }
    >
      {message ? <p className="mb-3 text-sm text-destructive">{message}</p> : null}

      {!isEdit && step === 'kind' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
            onClick={() => {
              setKind('writing')
              setStep('form')
            }}
          >
            <span className="block text-base font-semibold">Tribune</span>
            <span className="mt-1 block text-sm text-muted-foreground">Analyse, opinion, lien vers un article</span>
          </button>
          <button
            type="button"
            className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
            onClick={() => {
              setKind('event')
              setStep('form')
            }}
          >
            <span className="block text-base font-semibold">Événement</span>
            <span className="mt-1 block text-sm text-muted-foreground">Lieu, date, description</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {!isEdit ? (
            <SegmentedToggle
              options={[
                { id: 'writing', label: 'Tribune', active: kind === 'writing', onSelect: () => setKind('writing') },
                { id: 'event', label: 'Événement', active: kind === 'event', onSelect: () => setKind('event') },
              ]}
            />
          ) : null}

          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Titre
            </Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              {kind === 'event' ? 'Description' : 'Texte'}
            </Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="min-h-[8rem] rounded-xl"
            />
          </div>

          {kind === 'writing' ? (
            <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3">
              <Label size="sm" className="text-muted-foreground">
                Référencer un article (recherche ou lien)
              </Label>
              <Input
                value={articleQuery}
                onChange={(e) => {
                  setArticleQuery(e.target.value)
                  setSelectedArticle(null)
                }}
                placeholder="Titre, mot-clé, URL ou ID d’article…"
                className="rounded-lg"
              />
              {selectedArticle ? (
                <div className="flex items-start justify-between gap-2 rounded-lg bg-background px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{selectedArticle.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{selectedArticle.slug}</span>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-primary underline"
                    onClick={() => setSelectedArticle(null)}
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <>
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {articleLoading ? (
                      <p className="text-xs text-muted-foreground">Recherche…</p>
                    ) : articleResults.length === 0 && debouncedArticleQuery.trim().length >= 2 ? (
                      <p className="text-xs text-muted-foreground">Aucun article trouvé.</p>
                    ) : (
                      articleResults.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="flex w-full flex-col rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setSelectedArticle(a)
                            setArticleQuery('')
                          }}
                        >
                          <span className="font-medium line-clamp-2">{a.title}</span>
                          <span className="text-xs text-muted-foreground">{a.slug}</span>
                        </button>
                      ))
                    )}
                  </div>
                  {canLoadMore ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary underline"
                      onClick={() => setArticlePage((p) => p + 1)}
                    >
                      Charger plus de résultats
                    </button>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
                  Lieu
                </Label>
                <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
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
          )}
        </div>
      )}
    </Dialog>
  )
}
