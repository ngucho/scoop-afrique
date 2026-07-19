'use client'

import { useEffect } from 'react'
import { recordReaderArticle } from '@/lib/readerHistory'

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
  }, [article])

  return null
}
