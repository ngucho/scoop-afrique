import { and, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { articles, readerSavedArticles } from '../db/schema.js'
import { config } from '../config/env.js'
import { listPublishedArticleCardsByIds, type PublicArticleCard } from './article.service.js'

export interface OfflineManifestItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string
  updated_at: string
  version: number
  reading_time_min: number
  content_url: string
}

export interface OfflineManifest {
  generated_at: string
  max_updated_at: string | null
  items: OfflineManifestItem[]
}

function apiPrefix(): string {
  return config.apiPrefix.replace(/\/+$/, '')
}

export function toOfflineManifestItem(card: PublicArticleCard): OfflineManifestItem | null {
  if (!card.published_at) return null
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    excerpt: card.excerpt,
    cover_image_url: card.cover_image_url,
    published_at: card.published_at,
    updated_at: card.updated_at,
    version: card.version,
    reading_time_min: card.reading_time_min,
    content_url: `${apiPrefix()}/articles/${encodeURIComponent(card.slug)}?track_view=0`,
  }
}

export async function getOfflineManifest(options: { limit: number }): Promise<OfflineManifest> {
  if (!config.database) {
    return { generated_at: new Date().toISOString(), max_updated_at: null, items: [] }
  }

  const db = getDb()
  const limit = Math.min(Math.max(options.limit, 1), 200)
  const rows = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.status, 'published'), isNotNull(articles.publishedAt)))
    .orderBy(desc(articles.updatedAt), desc(articles.publishedAt))
    .limit(limit)

  const cards = await listPublishedArticleCardsByIds(rows.map((r) => r.id))
  const items = cards.map(toOfflineManifestItem).filter((i): i is OfflineManifestItem => i !== null)
  const maxUpdatedAt = items.reduce<string | null>(
    (max, item) => (max === null || item.updated_at > max ? item.updated_at : max),
    null,
  )

  return {
    generated_at: new Date().toISOString(),
    max_updated_at: maxUpdatedAt,
    items,
  }
}

export async function listSavedArticles(auth0Sub: string): Promise<PublicArticleCard[]> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select({ articleId: readerSavedArticles.articleId })
    .from(readerSavedArticles)
    .where(eq(readerSavedArticles.auth0Sub, auth0Sub))
    .orderBy(desc(readerSavedArticles.savedAt))
  return listPublishedArticleCardsByIds(rows.map((r) => r.articleId))
}

export async function saveArticleForReader(input: {
  auth0Sub: string
  articleId: string
  offlineEnabled?: boolean
}): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [article] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.id, input.articleId), eq(articles.status, 'published'), isNotNull(articles.publishedAt)))
    .limit(1)
  if (!article) return false

  await db
    .insert(readerSavedArticles)
    .values({
      auth0Sub: input.auth0Sub,
      articleId: input.articleId,
      offlineEnabled: input.offlineEnabled ?? true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [readerSavedArticles.auth0Sub, readerSavedArticles.articleId],
      set: {
        offlineEnabled: input.offlineEnabled ?? true,
        updatedAt: new Date(),
      },
    })
  return true
}

export async function unsaveArticleForReader(auth0Sub: string, articleId: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const deleted = await db
    .delete(readerSavedArticles)
    .where(and(eq(readerSavedArticles.auth0Sub, auth0Sub), eq(readerSavedArticles.articleId, articleId)))
    .returning({ articleId: readerSavedArticles.articleId })
  return deleted.length > 0
}

export async function listSavedArticleIdsForOffline(auth0Sub: string): Promise<string[]> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select({ articleId: readerSavedArticles.articleId })
    .from(readerSavedArticles)
    .where(and(eq(readerSavedArticles.auth0Sub, auth0Sub), eq(readerSavedArticles.offlineEnabled, true)))
    .orderBy(sql`${readerSavedArticles.updatedAt} DESC`)
  return rows.map((r) => r.articleId)
}
