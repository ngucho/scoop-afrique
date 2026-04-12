import type { Article, ArticlesResponse, Category } from '@/lib/api/types'
import type { HomepageSection } from '@/lib/api/types'
import { apiGet } from '@/lib/api/client'
import { READER_CATEGORIES } from '@/lib/readerCategories'
import { AD_SLOT_KEYS, type AdSlotKey } from '@/lib/readerAds'

const POOL = 48

export type HomeInlineAdSlotKey = Extract<AdSlotKey, 'HOME_MID_1' | 'HOME_BOTTOM'>

export interface HomeSectionContext {
  articles: Article[]
  categories: Category[]
}

const KNOWN_SECTION_KEYS = new Set([
  'top_stories',
  'latest',
  'video',
  'trending',
  'editors',
  'rubriques',
  'partnership_strip',
  'home_ad_mid',
  'home_ad_bottom',
])

function inlineAdSlotKey(row: HomepageSection): HomeInlineAdSlotKey | null {
  if (row.key === 'home_ad_mid') return AD_SLOT_KEYS.HOME_MID_1
  if (row.key === 'home_ad_bottom') return AD_SLOT_KEYS.HOME_BOTTOM
  return null
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

/** Ordered blocks for the reader homepage (CMS `sort_order`, visibility, layout). */
export type HomePageBlock =
  | {
      type: 'hero'
      cmsKey: 'top_stories'
      title: string
      article: Article
    }
  | {
      type: 'articles'
      cmsKey: string
      sectionKey: 'latest' | 'video' | 'trending' | 'editors'
      title: string
      layout: HomepageSection['layout']
      articles: Article[]
    }
  | {
      type: 'rubriques'
      cmsKey: 'rubriques'
      title: string
      layout: HomepageSection['layout']
      strips: { slug: string; label: string; articles: Article[] }[]
    }
  | {
      type: 'inline_ad'
      cmsKey: 'home_ad_mid' | 'home_ad_bottom'
      adSlotKey: HomeInlineAdSlotKey
      title: string
    }

export interface BuildHomeSectionsResult extends HomeSectionContext {
  blocks: HomePageBlock[]
}

/**
 * Builds homepage blocks from the article pool + CMS (order, visibility, titles, limits, layout).
 */
export async function buildHomeSections(): Promise<BuildHomeSectionsResult> {
  const [articles, categories, cmsRows] = await Promise.all([
    getArticlePool(),
    getCategories(),
    getCmsHomepageSections(),
  ])

  const used = new Set<string>()
  const blocks: HomePageBlock[] = []

  const sorted = [...cmsRows]
    .filter((r) => r.is_visible && r.key !== 'partnership_strip')
    .sort((a, b) => a.sort_order - b.sort_order)

  const categorySlugSet = new Set(categories.map((c) => c.slug))

  for (const row of sorted) {
    if (!KNOWN_SECTION_KEYS.has(row.key)) continue

    switch (row.key) {
      case 'home_ad_mid':
      case 'home_ad_bottom': {
        const adSlotKey = inlineAdSlotKey(row)
        if (!adSlotKey) break
        blocks.push({
          type: 'inline_ad',
          cmsKey: row.key,
          adSlotKey,
          title: row.title,
        })
        break
      }
      case 'top_stories': {
        const picked = takeUnique(excludeIds(articles, used), used, 1)
        const article = picked[0]
        if (!article) break
        blocks.push({
          type: 'hero',
          cmsKey: 'top_stories',
          title: row.title,
          article,
        })
        break
      }
      case 'latest': {
        const maxLatest = numConfig(row.config, 'max_items', 10)
        const latest = takeUnique(excludeIds(articles, used), used, maxLatest)
        if (latest.length === 0) break
        blocks.push({
          type: 'articles',
          cmsKey: row.key,
          sectionKey: 'latest',
          title: row.title,
          layout: row.layout,
          articles: latest,
        })
        break
      }
      case 'video': {
        const videoTag = strConfig(row.config, 'tag', 'video')
        const maxVideo = numConfig(row.config, 'max_items', 8)
        const videoPool = [...articles].sort(byViewCount).filter((a) => articleMatchesVideoSection(a, videoTag))
        const videoArticles = takeUnique(excludeIds(videoPool, used), used, maxVideo)
        if (videoArticles.length === 0) break
        blocks.push({
          type: 'articles',
          cmsKey: row.key,
          sectionKey: 'video',
          title: row.title,
          layout: row.layout,
          articles: videoArticles,
        })
        break
      }
      case 'trending': {
        const maxTrend = numConfig(row.config, 'max_items', 5)
        const trendingPool = [...articles].sort(byViewCount)
        const trending = takeUnique(excludeIds(trendingPool, used), used, maxTrend)
        if (trending.length === 0) break
        blocks.push({
          type: 'articles',
          cmsKey: row.key,
          sectionKey: 'trending',
          title: row.title,
          layout: row.layout,
          articles: trending,
        })
        break
      }
      case 'editors': {
        const maxEditors = numConfig(row.config, 'max_items', 4)
        const editorsPicks = takeUnique(excludeIds(articles, used), used, maxEditors)
        if (editorsPicks.length === 0) break
        blocks.push({
          type: 'articles',
          cmsKey: row.key,
          sectionKey: 'editors',
          title: row.title,
          layout: row.layout,
          articles: editorsPicks,
        })
        break
      }
      case 'rubriques': {
        const strips: { slug: string; label: string; articles: Article[] }[] = []
        const perStrip = numConfig(row.config, 'max_per_strip', 2)
        for (const rc of READER_CATEGORIES.slice(0, 6)) {
          if (!categorySlugSet.has(rc.slug)) continue
          const inCat = articles.filter((a) => a.category?.slug === rc.slug)
          const picked = takeUnique(excludeIds(inCat, used), used, perStrip)
          if (picked.length === 0) continue
          strips.push({ slug: rc.slug, label: rc.label, articles: picked })
        }
        if (strips.length === 0) break
        blocks.push({
          type: 'rubriques',
          cmsKey: 'rubriques',
          title: row.title,
          layout: row.layout,
          strips,
        })
        break
      }
      default:
        break
    }
  }

  return {
    articles,
    categories,
    blocks,
  }
}
