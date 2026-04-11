import type { Article, ArticlesResponse, Category } from '@/lib/api/types'
import type { HomepageSection } from '@/lib/api/types'
import { apiGet } from '@/lib/api/client'
import { READER_CATEGORIES } from '@/lib/readerCategories'

const POOL = 48

export interface HomeSectionContext {
  articles: Article[]
  categories: Category[]
}

/** Block titles overridable from homepage CMS. */
export interface HomeBlockTitles {
  latest: string
  trending: string
  editors: string
  video: string
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

async function getCmsHomepageSections(): Promise<HomepageSection[]> {
  try {
    const res = await apiGet<{ data: HomepageSection[] }>('/homepage/sections', { revalidate: 30 })
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

function numConfig(config: Record<string, unknown> | undefined, key: string, fallback: number): number {
  const v = config?.[key]
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.min(100, v))
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n))
  }
  return fallback
}

function strConfig(config: Record<string, unknown> | undefined, key: string, fallback: string): string {
  const v = config?.[key]
  if (typeof v === 'string' && v.trim() !== '') return v.trim()
  return fallback
}

function articleMatchesVideoSection(article: Article, tag: string): boolean {
  const t = tag.toLowerCase()
  if (article.video_url && String(article.video_url).trim() !== '') return true
  return (article.tags ?? []).some((x) => String(x).toLowerCase() === t)
}

export interface HomeSections {
  featured: Article | null
  latest: Article[]
  videoArticles: Article[]
  trending: Article[]
  editorsPicks: Article[]
  categoryStrips: { slug: string; label: string; articles: Article[] }[]
}

export interface BuildHomeSectionsResult extends HomeSectionContext {
  sections: HomeSections
  titles: HomeBlockTitles
}

/**
 * Builds homepage sections from article pool + optional CMS (visibility, titles, limits).
 */
export async function buildHomeSections(): Promise<BuildHomeSectionsResult> {
  const [articles, categories, cmsRows] = await Promise.all([
    getArticlePool(),
    getCategories(),
    getCmsHomepageSections(),
  ])

  const cms = Object.fromEntries(cmsRows.map((r) => [r.key, r])) as Record<string, HomepageSection>
  const used = new Set<string>()

  const featured =
    cms.top_stories?.is_visible === false ? null : articles[0] ?? null
  if (featured) used.add(featured.id)

  const maxLatest = numConfig(cms.latest?.config, 'max_items', 10)
  let latest = takeUnique(excludeIds(articles, used), used, maxLatest)
  if (cms.latest?.is_visible === false) latest = []

  const videoTag = strConfig(cms.video?.config, 'tag', 'video')
  const maxVideo = numConfig(cms.video?.config, 'max_items', 8)
  const videoPool = [...articles].sort(byViewCount).filter((a) => articleMatchesVideoSection(a, videoTag))
  let videoArticles = takeUnique(excludeIds(videoPool, used), used, maxVideo)
  if (cms.video?.is_visible === false) videoArticles = []

  const maxTrend = numConfig(cms.trending?.config, 'max_items', 5)
  const trendingPool = [...articles].sort(byViewCount)
  let trending = takeUnique(excludeIds(trendingPool, used), used, maxTrend)
  if (cms.trending?.is_visible === false) trending = []

  const maxEditors = numConfig(cms.editors?.config, 'max_items', 4)
  let editorsPicks = takeUnique(excludeIds(articles, used), used, maxEditors)
  if (cms.editors?.is_visible === false) editorsPicks = []

  const categorySlugSet = new Set(categories.map((c) => c.slug))
  const strips: { slug: string; label: string; articles: Article[] }[] = []

  if (cms.rubriques?.is_visible !== false) {
    const perStrip = numConfig(cms.rubriques?.config, 'max_per_strip', 2)
    for (const rc of READER_CATEGORIES.slice(0, 6)) {
      if (!categorySlugSet.has(rc.slug)) continue
      const inCat = articles.filter((a) => a.category?.slug === rc.slug)
      const picked = takeUnique(excludeIds(inCat, used), used, perStrip)
      if (picked.length === 0) continue
      strips.push({ slug: rc.slug, label: rc.label, articles: picked })
    }
  }

  const titles: HomeBlockTitles = {
    latest: cms.latest?.title ?? 'Dernières actualités',
    trending: cms.trending?.title ?? 'Les plus lus',
    editors: cms.editors?.title ?? 'Sélection de la rédaction',
    video: cms.video?.title ?? 'Vidéos',
  }

  return {
    articles,
    categories,
    sections: {
      featured,
      latest,
      videoArticles,
      trending,
      editorsPicks,
      categoryStrips: strips,
    },
    titles,
  }
}
