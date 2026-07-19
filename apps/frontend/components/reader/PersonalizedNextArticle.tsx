'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Article } from '@/lib/api/types'
import { readerHistoryIds, readReaderHistory, READER_STATE_EVENT, syncRecentReaderHistoryToAccount } from '@/lib/readerHistory'
import { RecommendedNextArticle } from '@/components/reader/RecommendedNextArticle'

interface PersonalizedNextArticleProps {
  currentArticleId: string
  initialArticle: Article | null
  className?: string
  fallback?: ReactNode
}

async function fetchPersonalizedRecommendation(articleId: string, historyIds: string[]): Promise<Article | null> {
  const params = new URLSearchParams({ article_id: articleId })
  if (historyIds.length) params.set('history', historyIds.join(','))
  const res = await fetch(`/api/reader-bff/article-recommendation?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as { data?: Article | null }
  return json.data ?? null
}

export function PersonalizedNextArticle({
  currentArticleId,
  initialArticle,
  className = '',
  fallback = null,
}: PersonalizedNextArticleProps) {
  const [article, setArticle] = useState<Article | null>(initialArticle)
  const [resolved, setResolved] = useState(Boolean(initialArticle))

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      const history = readReaderHistory()
      syncRecentReaderHistoryToAccount(history)
      const ids = readerHistoryIds(history)
      const next = await fetchPersonalizedRecommendation(currentArticleId, ids).catch(() => null)
      if (!cancelled) {
        if (next) setArticle(next)
        setResolved(true)
      }
    }

    refresh()
    const onState = () => refresh()
    window.addEventListener(READER_STATE_EVENT, onState)
    return () => {
      cancelled = true
      window.removeEventListener(READER_STATE_EVENT, onState)
    }
  }, [currentArticleId])

  if (!article) return resolved ? fallback : null
  return <RecommendedNextArticle article={article} className={className} />
}
