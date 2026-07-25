'use client'

import { useEffect } from 'react'
import { recordReaderArticle, trackReaderArticleView } from '@/lib/readerHistory'

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
      recordReaderArticle(article)
    } catch {
      // Reading history is best-effort; article reading should never fail because of it.
    }

    let timer: ReturnType<typeof setTimeout> | null = null
    let tracked = false
    const scheduleTracking = () => {
      if (tracked || document.visibilityState !== 'visible') return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        if (document.visibilityState !== 'visible') return
        tracked = true
        void trackReaderArticleView(article.id)
      }, 1500)
    }

    scheduleTracking()
    document.addEventListener('visibilitychange', scheduleTracking)
    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', scheduleTracking)
    }
  }, [article])

  return null
}
