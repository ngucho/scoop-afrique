'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Clock3, Sparkles } from 'lucide-react'
import type { Article } from '@/lib/api/types'
import {
  latestReaderArticle,
  readerHistoryIds,
  readReaderHistory,
  READER_STATE_EVENT,
  syncRecentReaderHistoryToAccount,
  type ReaderHistoryItem,
} from '@/lib/readerHistory'
import { ReaderCoverImage } from '@/components/reader/ReaderCoverImage'

async function fetchRecommendationFromLastRead(last: ReaderHistoryItem): Promise<Article | null> {
  const ids = readerHistoryIds()
  const params = new URLSearchParams({ article_id: last.id })
  if (ids.length) params.set('history', ids.join(','))
  const res = await fetch(`/api/reader-bff/article-recommendation?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as { data?: Article | null }
  return json.data ?? null
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export function HomeReaderPulse() {
  const [lastRead, setLastRead] = useState<ReaderHistoryItem | null>(null)
  const [suggestion, setSuggestion] = useState<Article | null>(null)

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      const history = readReaderHistory()
      syncRecentReaderHistoryToAccount(history)
      const last = latestReaderArticle(history)
      if (!last) {
        setLastRead(null)
        setSuggestion(null)
        return
      }
      setLastRead(last)
      const next = await fetchRecommendationFromLastRead(last).catch(() => null)
      if (!cancelled) setSuggestion(next)
    }

    refresh()
    const onState = () => refresh()
    window.addEventListener(READER_STATE_EVENT, onState)
    return () => {
      cancelled = true
      window.removeEventListener(READER_STATE_EVENT, onState)
    }
  }, [])

  if (!lastRead) return null

  return (
    <section className="mx-auto max-w-[1460px] px-5 pb-8 sm:px-8 lg:px-10">
      <div className="grid overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[var(--shadow-lg)] lg:grid-cols-[0.86fr_1.14fr]">
        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.14em] text-foreground">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              Ton fil reprend
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">
              Dernière lecture le {shortDate(lastRead.viewed_at)}
            </p>
            <Link
              href={`/articles/${lastRead.slug}`}
              className="mt-2 block text-xl font-black leading-tight text-foreground transition hover:text-primary sm:text-2xl"
            >
              {lastRead.title}
            </Link>
          </div>
          <Link
            href={`/articles/${lastRead.slug}`}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-foreground px-4 font-sans text-xs font-black uppercase tracking-[0.1em] text-background"
          >
            Reprendre <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {suggestion ? (
          <Link
            href={`/articles/${suggestion.slug}`}
            className="group grid border-t border-border bg-foreground text-background transition hover:bg-foreground/95 sm:grid-cols-[180px_1fr] lg:border-l lg:border-t-0"
          >
            <div className="relative min-h-[180px] bg-background/10">
              {suggestion.cover_image_url ? (
                <ReaderCoverImage
                  src={suggestion.cover_image_url}
                  alt=""
                  aspectClassName="absolute inset-0 h-full"
                  className="h-full"
                  sizes="(max-width: 1024px) 100vw, 220px"
                  imgClassName="transition duration-700 group-hover:scale-[1.04]"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/65 to-transparent" />
            </div>
            <div className="flex min-h-[180px] flex-col justify-end p-5 sm:p-6">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-background/12 px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.14em] text-background/82">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                Pour toi
              </div>
              <h2 className="line-clamp-3 text-2xl font-black leading-[1.02] text-background">
                {suggestion.title}
              </h2>
              {suggestion.category?.name ? (
                <p className="mt-3 font-sans text-xs font-bold uppercase tracking-[0.12em] text-background/62">
                  {suggestion.category.name}
                </p>
              ) : null}
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  )
}
