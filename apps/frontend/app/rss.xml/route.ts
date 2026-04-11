import { apiGet } from '@/lib/api/client'
import { buildArticlesRssFeed } from '@/lib/rss'
import type { ArticlesResponse } from '@/lib/api/types'

export const revalidate = 600

export async function GET() {
  try {
    const res = await apiGet<ArticlesResponse>('/articles?limit=50&page=1', { revalidate: 600 })
    const xml = buildArticlesRssFeed(res.data ?? [])
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    })
  } catch {
    const xml = buildArticlesRssFeed([])
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60',
      },
    })
  }
}
