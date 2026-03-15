import { eq, and, or } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { articleLikes } from '../db/schema.js'
import { config } from '../config/env.js'

export async function getLikeCount(articleId: string): Promise<number> {
  if (!config.database) return 0
  const db = getDb()
  const rows = await db
    .select()
    .from(articleLikes)
    .where(eq(articleLikes.articleId, articleId))
  return rows.length
}

export async function hasLiked(articleId: string, userId: string | null, anonymousId: string | null): Promise<boolean> {
  if (!config.database) return false
  if (!userId && !anonymousId) return false
  const db = getDb()
  const conditions = userId
    ? and(eq(articleLikes.articleId, articleId), eq(articleLikes.userId, userId))
    : and(eq(articleLikes.articleId, articleId), eq(articleLikes.anonymousId, anonymousId!))
  const [row] = await db.select().from(articleLikes).where(conditions).limit(1)
  return !!row
}

export async function toggleLike(
  articleId: string,
  userId: string | null,
  anonymousId: string | null
): Promise<{ count: number; liked: boolean }> {
  if (!config.database) return { count: 0, liked: false }
  if (!userId && !anonymousId) return { count: await getLikeCount(articleId), liked: false }
  const db = getDb()
  const existing = await hasLiked(articleId, userId, anonymousId)
  if (existing) {
    const conditions = userId
      ? and(eq(articleLikes.articleId, articleId), eq(articleLikes.userId, userId))
      : and(eq(articleLikes.articleId, articleId), eq(articleLikes.anonymousId, anonymousId!))
    await db.delete(articleLikes).where(conditions)
  } else {
    await db.insert(articleLikes).values({
      articleId,
      userId: userId ?? null,
      anonymousId: anonymousId ?? null,
    })
  }
  const count = await getLikeCount(articleId)
  return { count, liked: !existing }
}
