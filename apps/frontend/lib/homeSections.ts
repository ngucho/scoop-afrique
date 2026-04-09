import type { Article, ArticlesResponse, Category } from '@/lib/api/types'
import { apiGet } from '@/lib/api/client'
import { READER_CATEGORIES } from '@/lib/readerCategories'

const POOL = 24

export interface HomeSectionContext {
  articles: Article[]
  categories: Category[]
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiGet<{ data: Category[] }>('/categories', { revalidate: 600 })
    return res.data ?? []
  } catch {
    return []
  }
}

async function getArticlePool(): Promise<Article[]> {
  try {
    const res = await apiGet<ArticlesResponse>(`/articles?limit=${POOL}&page=1`, { revalidate: 30 })
    return res.data ?? []
  } catch {
    return []
  }
}

function byViewCount(a: Article, b: Article) {
  return (b.view_count ?? 0) - (a.view_count ?? 0)
}

function excludeIds(articles: Article[], exclude: Set<string>): Article[] {
  return articles.filter((a) => !exclude.has(a.id))
}

function takeUnique(articles: Article[], exclude: Set<string>, n: number): Article[] {
  const out: Article[] = []
  for (const a of articles) {
    if (exclude.has(a.id)) continue
    exclude.add(a.id)
    out.push(a)
    if (out.length >= n) break
  }
  return out
}

/**
 * Builds modular homepage sections from a single API article pool + categories.
 */
export async function buildHomeSections(): Promise<HomeSectionContext & { sections: HomeSections }> {
  const [articles, categories] = await Promise.all([getArticlePool(), getCategories()])
  const used = new Set<string>()

  const featured = articles[0] ?? null
  if (featured) used.add(featured.id)

  const latest = takeUnique(excludeIds(articles, used), used, 6)

  const trendingPool = [...articles].sort(byViewCount)
  const trending = takeUnique(excludeIds(trendingPool, used), used, 5)

  const editors = takeUnique(excludeIds(articles, used), used, 4)

  const categorySlugSet = new Set(categories.map((c) => c.slug))
  const strips: { slug: string; label: string; articles: Article[] }[] = []

  for (const rc of READER_CATEGORIES.slice(0, 6)) {
    if (!categorySlugSet.has(rc.slug)) continue
    const inCat = articles.filter((a) => a.category?.slug === rc.slug)
    const picked = takeUnique(excludeIds(inCat, used), used, 2)
    if (picked.length === 0) continue
    strips.push({ slug: rc.slug, label: rc.label, articles: picked })
  }

  return {
    articles,
    categories,
    sections: {
      featured,
      latest,
      trending,
      editorsPicks: editors,
      categoryStrips: strips,
    },
  }
}

export interface HomeSections {
  featured: Article | null
  latest: Article[]
  trending: Article[]
  editorsPicks: Article[]
  categoryStrips: { slug: string; label: string; articles: Article[] }[]
}
