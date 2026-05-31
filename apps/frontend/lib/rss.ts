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

function absoluteImageUrl(url: string | null | undefined, origin: string): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * RSS 2.0 feed with media extensions for news aggregators.
 *
 * Namespaces:
 * - atom: — self-referencing link (required by validators)
 * - media: — image thumbnails for aggregators (Feedly, Flipboard, Apple News, etc.)
 * - dc:   — Dublin Core for author/creator attribution
 * - content: — full content encoding
 *
 * Compatible with:
 * - Google News (via news sitemap, RSS as fallback)
 * - Apple News (auto-discovery via <link rel="alternate"> in <head>)
 * - Feedly, Flipboard, Pocket, Inoreader (all support media: namespace)
 * - Microsoft News Producer (via RSS submission)
 * - Yahoo News (via RSS)
 */
export function buildArticlesRssFeed(articles: Article[], opts?: { title?: string; description?: string }): string {
  const origin = config.siteUrl.replace(/\/$/, '')
  const channelTitle = opts?.title ?? 'Scoop.Afrique — Actualités panafricaines'
  const channelDescription =
    opts?.description ??
    "Le média digital qui décrypte l'Afrique autrement. Actualités, politique, culture, sport, société depuis Abidjan, Côte d'Ivoire."
  const buildDate = new Date().toUTCString()

  const items = articles
    .filter((a) => a.status === 'published' && a.slug && a.published_at)
    .map((a) => {
      const link = `${origin}/articles/${escapeXml(a.slug)}`
      const pub = a.published_at ? new Date(a.published_at).toUTCString() : buildDate
      const desc = escapeXml((a.excerpt ?? a.title).slice(0, 500))
      const authorName = escapeXml(
        (a as unknown as Record<string, unknown>).author_display_name as string ?? 'Rédaction Scoop.Afrique'
      )
      const coverUrl = absoluteImageUrl(
        (a as unknown as Record<string, unknown>).og_image_url as string | null ?? a.cover_image_url,
        origin
      )
      const categoryName = a.category?.name ?? ''
      const tags = (a.tags ?? []).slice(0, 6)

      const mediaContent = coverUrl
        ? `<media:content url="${escapeXml(coverUrl)}" medium="image" width="1200" height="630"/>
      <media:thumbnail url="${escapeXml(coverUrl)}" width="480" height="270"/>
      <media:description type="html">${desc}</media:description>`
        : ''

      const categoryEl = categoryName
        ? `<category domain="${origin}/category/${escapeXml(a.category?.slug ?? '')}">${escapeXml(categoryName)}</category>`
        : ''

      const tagEls = tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ')

      return `  <item>
    <title>${escapeXml(a.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pub}</pubDate>
    <description>${desc}</description>
    <dc:creator>${authorName}</dc:creator>
    ${categoryEl}
    ${tagEls}
    ${mediaContent}
  </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/rss-style.xsl"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
>
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${origin}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>fr-fr</language>
    <copyright>© ${new Date().getFullYear()} Scoop.Afrique — Tous droits réservés</copyright>
    <managingEditor>Contact@scoop-afrique.com (Scoop.Afrique)</managingEditor>
    <webMaster>Contact@scoop-afrique.com (Scoop.Afrique)</webMaster>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <ttl>10</ttl>
    <category>News &amp; Media</category>
    <category>African News</category>
    <image>
      <url>${origin}/icon.svg</url>
      <title>${escapeXml(channelTitle)}</title>
      <link>${origin}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
    <atom:link href="${origin}/news-sitemap.xml" rel="related" type="application/rss+xml" title="Google News Sitemap"/>

${items}
  </channel>
</rss>`
}
