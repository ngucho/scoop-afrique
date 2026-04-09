import { apiGet } from '@/lib/api/client'
import type { Article, ArticlesResponse } from '@/lib/api/types'

export async function getContextSidebarArticles(
  excludeSlug: string,
  categorySlug: string | null,
  limit = 4
): Promise<Article[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit + 4), page: '1' })
    if (categorySlug) params.set('category', categorySlug)
    const res = await apiGet<ArticlesResponse>(`/articles?${params}`, { revalidate: 60 })
    const rows = (res.data ?? []).filter((a) => a.slug !== excludeSlug)
    return rows.slice(0, limit)
  } catch {
    return []
  }
}
