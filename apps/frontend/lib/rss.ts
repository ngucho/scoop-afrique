import type { Article } from '@/lib/api/types'
import { config } from '@/lib/config'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** RSS 2.0 feed for latest published articles (syndication / agrégateurs). */
export function buildArticlesRssFeed(articles: Article[], opts?: { title?: string; description?: string }): string {
  const origin = config.siteUrl.replace(/\/$/, '')
  const title = opts?.title ?? 'Scoop.Afrique — Articles'
  const description =
    opts?.description ?? "Actualités et analyses panafricaines — flux des derniers articles publiés."
  const buildDate = new Date().toUTCString()

  const items = articles
    .filter((a) => a.status === 'published' && a.slug && a.published_at)
    .map((a) => {
      const link = `${origin}/articles/${escapeXml(a.slug)}`
      const pub = a.published_at ? new Date(a.published_at).toUTCString() : buildDate
      const desc = escapeXml((a.excerpt ?? a.title).slice(0, 500))
      const cat = a.category?.name ? `<category>${escapeXml(a.category.name)}</category>` : ''
      return `
 <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>
      ${cat}
    </item>`
 })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${origin}</link>
    <description>${escapeXml(description)}</description>
    <language>fr-fr</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`
}
