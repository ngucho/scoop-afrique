'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'scoop_reader_history'
const COOKIE_KEY = 'scoop_reader_history'
const MAX_HISTORY = 50

interface ArticleHistoryItem {
  id: string
  slug: string
  title: string
  category_id: string | null
  category_slug: string | null
  author_id: string
  tags: string[]
  viewed_at: string
}

export function ArticleHistoryTracker({
  article,
}: {
  article: Omit<ArticleHistoryItem, 'viewed_at'>
}) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const previous = raw ? (JSON.parse(raw) as ArticleHistoryItem[]) : []
      const nextItem: ArticleHistoryItem = { ...article, viewed_at: new Date().toISOString() }
      const next = [nextItem, ...previous.filter((item) => item.id !== article.id)].slice(0, MAX_HISTORY)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

      const ids = next.map((item) => item.id).join(',')
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(ids)}; Max-Age=31536000; Path=/; SameSite=Lax`

      fetch('/api/reader-bff/article-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: article.id }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // Reading history is best-effort; article reading should never fail because of it.
    }
  }, [article])

  return null
}
