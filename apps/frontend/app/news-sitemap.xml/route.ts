/**
 * Google News Sitemap — /news-sitemap.xml
 *
 * Format: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 *
 * Rules for Google News indexing:
 * - Articles must be published within the last 2 days to appear in Google News
 * - Use ISO 8601 publication dates
 * - Title must exactly match the article headline
 * - Publication name must match the registered Google Publisher name
 *
 * Google Publisher Center: https://publishercenter.google.com/
 * Submit sitemap in Google Search Console after verifying ownership.
 */
import { NextResponse } from 'next/server'
import { apiGet } from '@/lib/api/client'
import { config } from '@/lib/config'

export const revalidate = 60 // Revalidate every minute for breaking news freshness

const SITE_URL = config.siteUrl.replace(/\/$/, '')
const PUBLICATION_NAME = 'Scoop.Afrique'
const PUBLICATION_LANGUAGE = 'fr'

interface NewsArticle {
  slug: string
  title: string
  published_at: string
  tags: string[]
  category_name: string | null
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildKeywords(article: NewsArticle): string {
  const parts: string[] = []
  if (article.category_name) parts.push(article.category_name)
  if (article.tags?.length) parts.push(...article.tags.slice(0, 5))
  parts.push('Afrique', 'actualités africaines')
  return [...new Set(parts)].join(', ')
}

function buildNewsSitemap(articles: NewsArticle[]): string {
  const urlEntries = articles
    .filter((a) => a.slug && a.title && a.published_at)
    .map((article) => {
      const url = `${SITE_URL}/articles/${article.slug}`
      // Format date as ISO 8601 with timezone offset (required by Google News)
      const pubDate = new Date(article.published_at).toISOString()
      const keywords = buildKeywords(article)
      return `  <url>
    <loc>${escapeXml(url)}</loc>
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
<!-- Google News Sitemap for ${PUBLICATION_NAME} -->
<!-- Submitted via Google Publisher Center: https://publishercenter.google.com/ -->
<!-- Verified via Google Search Console: https://search.google.com/search-console -->
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>
${urlEntries}
</urlset>`
}

export async function GET() {
  try {
    // Fetch articles from last 72 hours (Google News requires < 2 days for real-time, we cast wider)
    const res = await apiGet<{ data: NewsArticle[] }>('/sitemap/news?hours=72', {
      revalidate: 60,
    })
    const articles = res.data ?? []
    const xml = buildNewsSitemap(articles)

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch {
    // Return empty valid sitemap on error
    const empty = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`
    return new NextResponse(empty, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }
}
