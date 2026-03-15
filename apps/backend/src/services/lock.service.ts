/**
 * Article lock service — pessimistic locking (one editor at a time).
 * Lock expires after 5 minutes; heartbeat renews it.
 */
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { articleLocks, profiles } from '../db/schema.js'
import { config } from '../config/env.js'

const LOCK_TTL_MIN = 5

export interface ArticleLock {
  article_id: string
  locked_by: string
  locked_at: string
  expires_at: string
  /** Joined profile email for display */
  locker_email?: string
}

/**
 * Acquire lock. Returns lock info on success, or the existing lock if held by another user.
 * Expired locks are replaced.
 */
export async function acquireLock(
  articleId: string,
  userId: string,
): Promise<{ acquired: true; lock: ArticleLock } | { acquired: false; lock: ArticleLock }> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const now = new Date()

  // Check existing lock with profile join for email
  const [existing] = await db
    .select({
      articleId: articleLocks.articleId,
      lockedBy: articleLocks.lockedBy,
      lockedAt: articleLocks.lockedAt,
      expiresAt: articleLocks.expiresAt,
      lockerEmail: profiles.email,
    })
    .from(articleLocks)
    .leftJoin(profiles, eq(articleLocks.lockedBy, profiles.id))
    .where(eq(articleLocks.articleId, articleId))
    .limit(1)

  if (existing) {
    const expiresAt = existing.expiresAt instanceof Date ? existing.expiresAt : new Date(existing.expiresAt as string)
    // If locked by same user or expired — replace
    if (existing.lockedBy === userId || expiresAt < now) {
      const newExpires = new Date(now.getTime() + LOCK_TTL_MIN * 60_000)
      const [updated] = await db
        .update(articleLocks)
        .set({ lockedBy: userId, lockedAt: now, expiresAt: newExpires })
        .where(eq(articleLocks.articleId, articleId))
        .returning()
      const lockRow = updated ?? existing
      return {
        acquired: true,
        lock: {
          article_id: lockRow.articleId,
          locked_by: lockRow.lockedBy,
          locked_at: (lockRow.lockedAt instanceof Date ? lockRow.lockedAt : new Date(lockRow.lockedAt as string)).toISOString(),
          expires_at: (lockRow.expiresAt instanceof Date ? lockRow.expiresAt : new Date(lockRow.expiresAt as string)).toISOString(),
          locker_email: (existing.lockerEmail as string) ?? undefined,
        },
      }
    }
    // Locked by someone else and not expired
    return {
      acquired: false,
      lock: {
        article_id: existing.articleId,
        locked_by: existing.lockedBy,
        locked_at: (existing.lockedAt instanceof Date ? existing.lockedAt : new Date(existing.lockedAt as string)).toISOString(),
        expires_at: (existing.expiresAt instanceof Date ? existing.expiresAt : new Date(existing.expiresAt as string)).toISOString(),
        locker_email: (existing.lockerEmail as string) ?? undefined,
      },
    }
  }

  // No lock exists — create
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MIN * 60_000)
  try {
    const [created] = await db
      .insert(articleLocks)
      .values({ articleId, lockedBy: userId, lockedAt: now, expiresAt })
      .returning()
    if (created) {
      return {
        acquired: true,
        lock: {
          article_id: created.articleId,
          locked_by: created.lockedBy,
          locked_at: (created.lockedAt instanceof Date ? created.lockedAt : new Date(created.lockedAt as string)).toISOString(),
          expires_at: (created.expiresAt instanceof Date ? created.expiresAt : new Date(created.expiresAt as string)).toISOString(),
        },
      }
    }
  } catch {
    // Race condition: another user inserted between our check and insert
  }

  const [raced] = await db
    .select({
      articleId: articleLocks.articleId,
      lockedBy: articleLocks.lockedBy,
      lockedAt: articleLocks.lockedAt,
      expiresAt: articleLocks.expiresAt,
      lockerEmail: profiles.email,
    })
    .from(articleLocks)
    .leftJoin(profiles, eq(articleLocks.lockedBy, profiles.id))
    .where(eq(articleLocks.articleId, articleId))
    .limit(1)

  if (raced && raced.lockedBy !== userId) {
    return {
      acquired: false,
      lock: {
        article_id: raced.articleId,
        locked_by: raced.lockedBy,
        locked_at: (raced.lockedAt instanceof Date ? raced.lockedAt : new Date(raced.lockedAt as string)).toISOString(),
        expires_at: (raced.expiresAt instanceof Date ? raced.expiresAt : new Date(raced.expiresAt as string)).toISOString(),
        locker_email: (raced.lockerEmail as string) ?? undefined,
      },
    }
  }

  // Fallback: we got the lock
  const [final] = await db.select().from(articleLocks).where(eq(articleLocks.articleId, articleId)).limit(1)
  if (final) {
    return {
      acquired: true,
      lock: {
        article_id: final.articleId,
        locked_by: final.lockedBy,
        locked_at: (final.lockedAt instanceof Date ? final.lockedAt : new Date(final.lockedAt as string)).toISOString(),
        expires_at: (final.expiresAt instanceof Date ? final.expiresAt : new Date(final.expiresAt as string)).toISOString(),
      },
    }
  }
  throw new Error('Failed to acquire lock')
}

/** Renew lock (heartbeat). Returns updated lock or null if not owner. */
export async function renewLock(articleId: string, userId: string): Promise<ArticleLock | null> {
  if (!config.database) return null
  const db = getDb()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MIN * 60_000)

  const [row] = await db
    .update(articleLocks)
    .set({ expiresAt })
    .where(and(eq(articleLocks.articleId, articleId), eq(articleLocks.lockedBy, userId)))
    .returning()

  if (!row) return null
  return {
    article_id: row.articleId,
    locked_by: row.lockedBy,
    locked_at: (row.lockedAt instanceof Date ? row.lockedAt : new Date(row.lockedAt as string)).toISOString(),
    expires_at: (row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt as string)).toISOString(),
  }
}

/** Release lock. Only the owner can release. */
export async function releaseLock(articleId: string, userId: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [deleted] = await db
    .delete(articleLocks)
    .where(and(eq(articleLocks.articleId, articleId), eq(articleLocks.lockedBy, userId)))
    .returning({ articleId: articleLocks.articleId })
  return !!deleted
}

/** Get current lock status. Returns null if unlocked or expired. */
export async function getLock(articleId: string): Promise<ArticleLock | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .select({
      articleId: articleLocks.articleId,
      lockedBy: articleLocks.lockedBy,
      lockedAt: articleLocks.lockedAt,
      expiresAt: articleLocks.expiresAt,
      lockerEmail: profiles.email,
    })
    .from(articleLocks)
    .leftJoin(profiles, eq(articleLocks.lockedBy, profiles.id))
    .where(eq(articleLocks.articleId, articleId))
    .limit(1)

  if (!row) return null

  const expiresAt = row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt as string)
  if (expiresAt < new Date()) {
    await db.delete(articleLocks).where(eq(articleLocks.articleId, articleId))
    return null
  }
  return {
    article_id: row.articleId,
    locked_by: row.lockedBy,
    locked_at: (row.lockedAt instanceof Date ? row.lockedAt : new Date(row.lockedAt as string)).toISOString(),
    expires_at: expiresAt.toISOString(),
    locker_email: (row.lockerEmail as string) ?? undefined,
  }
}
