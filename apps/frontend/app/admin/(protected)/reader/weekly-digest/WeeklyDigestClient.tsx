'use client'

import { useCallback, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'scoop'
import {
  IconLoader2,
  IconRefresh,
  IconSend,
  IconPlayerPlay,
  IconX,
  IconGripVertical,
  IconEye,
  IconArrowUp,
  IconArrowDown,
  IconCheck,
} from '@tabler/icons-react'
import type { DigestArticlePickRow } from '@/lib/api/types'
import { previewWeeklyNewsletterDigest, sendWeeklyNewsletterDigest } from '@/lib/admin/actions'

const CATEGORY_COLORS: Record<string, string> = {
  politique: '#dc2626',
  economie: '#0369a1',
  culture: '#7c3aed',
  sport: '#059669',
  international: '#b45309',
  technologie: '#0e7490',
  societe: '#be185d',
}
function catColor(slug: string | null): string {
  if (!slug) return '#6b7280'
  const key = Object.keys(CATEGORY_COLORS).find((k) => slug.toLowerCase().includes(k))
  if (key) return CATEGORY_COLORS[key]!
  const h = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const palette = ['#dc2626', '#0369a1', '#7c3aed', '#059669', '#b45309', '#0e7490']
  return palette[h % palette.length] ?? '#6b7280'
}

function fmtViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k vues`
  return `${n} vues`
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diffH = Math.round((Date.now() - new Date(dateStr).getTime()) / 3600000)
  if (diffH < 24) return `Il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `Il y a ${diffD}j`
  const diffW = Math.floor(diffD / 7)
  return `Il y a ${diffW} sem.`
}

interface SendResult {
  jobId: string
  articleIds: string[]
  recipientsAttempted: number
  recipientsSent: number
  recipientsFailed: number
  error?: string
  isDryRun: boolean
}

export function WeeklyDigestClient() {
  const [articles, setArticles] = useState<DigestArticlePickRow[] | null>(null)
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [lastResult, setLastResult] = useState<SendResult | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)
  const [pending, startTransition] = useTransition()

  const visibleArticles = articles?.filter((a) => !excludedIds.has(a.id)) ?? []
  const excludedArticles = articles?.filter((a) => excludedIds.has(a.id)) ?? []

  const loadPreview = useCallback(() => {
    setLastResult(null)
    startTransition(async () => {
      try {
        const data = await previewWeeklyNewsletterDigest(Array.from(excludedIds))
        setArticles(data)
      } catch {
        setLastResult({ jobId: '', articleIds: [], recipientsAttempted: 0, recipientsSent: 0, recipientsFailed: 0, error: 'Erreur lors du chargement.', isDryRun: false })
      }
    })
  }, [excludedIds])

  const runSend = useCallback((dryRun: boolean) => {
    setConfirmSend(false)
    setLastResult(null)
    startTransition(async () => {
      try {
        const r = await sendWeeklyNewsletterDigest(dryRun, Array.from(excludedIds))
        setLastResult({ ...r, isDryRun: dryRun })
      } catch {
        setLastResult({ jobId: '', articleIds: [], recipientsAttempted: 0, recipientsSent: 0, recipientsFailed: 0, error: 'Erreur lors de l'envoi.', isDryRun: dryRun })
      }
    })
  }, [excludedIds])

  function toggleExclude(id: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Controls ── */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h2 className="font-semibold">Digest hebdomadaire</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sélection intelligente : score sur popularité, diversité des rubriques et fraîcheur. Les articles déjà envoyés récemment sont exclus automatiquement.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={loadPreview} disabled={pending}>
            {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconRefresh className="h-4 w-4" />}
            {articles ? 'Recalculer la sélection' : 'Charger la sélection'}
          </Button>
          {articles && visibleArticles.length > 0 && (
            <>
              <Button type="button" variant="secondary" className="gap-2" onClick={() => runSend(true)} disabled={pending}>
                <IconPlayerPlay className="h-4 w-4" />
                Simulation (dry-run)
              </Button>
              {!confirmSend ? (
                <Button type="button" className="gap-2" onClick={() => setConfirmSend(true)} disabled={pending}>
                  <IconSend className="h-4 w-4" />
                  Envoyer maintenant
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2">
                  <p className="text-sm text-destructive font-medium">
                    Envoyer à tous les abonnés confirmés ?
                  </p>
                  <Button size="sm" onClick={() => runSend(false)} disabled={pending} className="bg-destructive hover:bg-destructive/90">
                    {pending ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmer'}
                  </Button>
                  <button type="button" onClick={() => setConfirmSend(false)} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Send result ── */}
      {lastResult && (
        <div className={`rounded-2xl border p-4 space-y-2 ${lastResult.error ? 'border-destructive/30 bg-destructive/5' : lastResult.isDryRun ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800' : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800'}`}>
          {lastResult.isDryRun && !lastResult.error && (
            <div className="flex items-center gap-2">
              <IconEye className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Simulation terminée</p>
            </div>
          )}
          {!lastResult.isDryRun && !lastResult.error && (
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Digest envoyé</p>
            </div>
          )}
          {lastResult.error && <p className="text-sm text-destructive font-medium">{lastResult.error}</p>}
          {!lastResult.error && (
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-muted-foreground">Destinataires : <strong className="text-foreground">{lastResult.recipientsAttempted}</strong></span>
              <span className="text-muted-foreground">Envoyés : <strong className="text-emerald-700 dark:text-emerald-400">{lastResult.recipientsSent}</strong></span>
              {lastResult.recipientsFailed > 0 && (
                <span className="text-muted-foreground">Échecs : <strong className="text-red-600">{lastResult.recipientsFailed}</strong></span>
              )}
              <span className="text-muted-foreground">Articles : <strong className="text-foreground">{lastResult.articleIds.length}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ── Article preview ── */}
      {articles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {visibleArticles.length} article{visibleArticles.length !== 1 ? 's' : ''} dans le digest
              {excludedIds.size > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">({excludedIds.size} exclu{excludedIds.size !== 1 ? 's' : ''})</span>
              )}
            </h3>
            {excludedIds.size > 0 && (
              <button type="button" onClick={() => setExcludedIds(new Set())} className="text-xs text-primary hover:underline">
                Réinitialiser les exclusions
              </button>
            )}
          </div>

          {visibleArticles.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">Tous les articles sont exclus. Décochez-en pour les réintégrer.</p>
          )}

          <div className="space-y-2">
            {visibleArticles.map((a, idx) => (
              <ArticleCard
                key={a.id}
                article={a}
                rank={idx + 1}
                isLead={idx === 0}
                excluded={false}
                onExclude={() => toggleExclude(a.id)}
              />
            ))}
          </div>

          {/* Excluded articles */}
          {excludedArticles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Articles exclus</p>
              {excludedArticles.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  rank={null}
                  isLead={false}
                  excluded={true}
                  onExclude={() => toggleExclude(a.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {articles && articles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Aucun article disponible pour le digest.</p>
      )}
    </div>
  )
}

/* ── Article card ─────────────────────────────────────────────────── */
function ArticleCard({
  article: a,
  rank,
  isLead,
  excluded,
  onExclude,
}: {
  article: DigestArticlePickRow
  rank: number | null
  isLead: boolean
  excluded: boolean
  onExclude: () => void
}) {
  const color = catColor(a.category_slug)

  return (
    <div className={`rounded-xl border transition-all ${excluded ? 'border-border/40 opacity-50 bg-muted/20' : isLead ? 'border-primary/30 bg-primary/3' : 'border-border bg-card hover:border-primary/20'}`}>
      <div className="flex items-start gap-3 p-3">
        {/* Rank */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          {rank !== null ? (
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isLead ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {rank}
            </span>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border">
              <IconX className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
        </div>

        {/* Cover image */}
        {a.cover_image_url && (
          <div className="shrink-0 rounded-lg overflow-hidden border border-border" style={{ width: 72, height: 48 }}>
            <Image
              src={a.cover_image_url}
              alt=""
              width={72}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {a.category_slug && (
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ background: color }}
              >
                {a.category_slug}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{fmtViews(a.view_count)}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{timeAgo(a.published_at)}</span>
          </div>
          <Link
            href={`/articles/${a.slug}`}
            className="block font-semibold text-sm text-foreground hover:text-primary leading-snug line-clamp-2"
            target="_blank"
            rel="noreferrer"
          >
            {a.title}
          </Link>
          {a.excerpt && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onExclude}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              excluded
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title={excluded ? 'Réintégrer' : 'Exclure du digest'}
          >
            {excluded ? 'Réintégrer' : 'Exclure'}
          </button>
        </div>
      </div>
    </div>
  )
}
