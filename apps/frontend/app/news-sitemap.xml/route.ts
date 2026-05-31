/**
 * Google News Sitemap — /news-sitemap.xml
 *
 * Uses the existing /articles public API (already deployed) — no new backend endpoint needed.
 *
 * Strategy:
 *   1. Fetch last 100 published articles (sorted by published_at desc)
 *   2. Include articles from the last 48h for real-time Google News indexing
 *   3. If fewer than 5 recent articles, also include older ones (up to 50 total)
 *      so the sitemap is never empty while the publication ramps up
 *
 * Google News format: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 * Google Publisher Center: https://publishercenter.google.com/
 */
import { NextResponse } from 'next/server'
import { apiGet } from '@/lib/api/client'
import { config } from '@/lib/config'
import type { Article } from '@/lib/api/types'

export const revalidate = 60

const SITE_URL = config.siteUrl.replace(/\/$/, '')
const PUBLICATION_NAME = 'Scoop.Afrique'
const PUBLICATION_LANGUAGE = 'fr'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildKeywords(article: Article): string {
  const parts: string[] = []
  if (article.category?.name) parts.push(article.category.name)
  if (article.tags?.length) parts.push(...article.tags.slice(0, 5))
  parts.push('Afrique', 'actualités africaines')
  return [...new Set(parts)].join(', ')
}

function buildNewsSitemap(articles: Article[]): string {
  const urlEntries = articles
    .filter((a) => a.slug && a.title && a.published_at)
    .map((article) => {
      const url = `${SITE_URL}/articles/${escapeXml(article.slug)}`
      const pubDate = new Date(article.published_at!).toISOString()
      const keywords = buildKeywords(article)
      return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      <news:keywords>${escapeXml(keywords)}</news:keywords>
    </news:news>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>
${urlEntries}
</urlset>`
}

export async function GET() {
  try {
    // Use the existing /articles public endpoint — always available in production
    const res = await apiGet<{ data: Article[]; total: number }>(
      '/articles?limit=100&page=1',
      { revalidate: 60 }
    )
    const all = (res.data ?? []).filter(
      (a) => a.status === 'published' && a.slug && a.title && a.published_at
    )

    // Prefer articles from the last 48h for Google News freshness signal
    const cutoff48h = Date.now() - 48 * 60 * 60 * 1000
    const cutoff30d = Date.now() - 30 * 24 * 60 * 60 * 1000

    const recent48h = all.filter(
      (a) => new Date(a.published_at!).getTime() >= cutoff48h
    )

    // If we have recent articles → use only those (ideal for Google News)
    // Otherwise fall back to last 30 days (up to 50), so sitemap is never empty
    const toInclude =
      recent48h.length >= 1
        ? recent48h
        : all.filter((a) => new Date(a.published_at!).getTime() >= cutoff30d).slice(0, 50)

    const xml = buildNewsSitemap(toInclude)

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch {
    const empty = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>
</urlset>`
    return new NextResponse(empty, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }
}
