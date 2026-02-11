/**
 * Article lock service — pessimistic locking (one editor at a time).
 * Lock expires after 5 minutes; heartbeat renews it.
 */
import { getSupabase } from '../lib/supabase.js'
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
  if (!config.supabase) throw new Error('Supabase not configured')
  const supabase = getSupabase()
  const now = new Date()

  // Check existing lock
  const { data: existing } = await supabase
    .from('article_locks')
    .select('*, locker:profiles!article_locks_locked_by_fkey(email)')
    .eq('article_id', articleId)
    .single()

  if (existing) {
    const expiresAt = new Date(existing.expires_at)
    // If locked by same user or expired — replace
    if (existing.locked_by === userId || expiresAt < now) {
      const newExpires = new Date(now.getTime() + LOCK_TTL_MIN * 60_000).toISOString()
      const { data: updated } = await supabase
        .from('article_locks')
        .update({ locked_by: userId, locked_at: now.toISOString(), expires_at: newExpires })
        .eq('article_id', articleId)
        .select()
        .single()
      return { acquired: true, lock: (updated ?? existing) as ArticleLock }
    }
    // Locked by someone else and not expired
    return {
      acquired: false,
      lock: {
        ...existing,
        locker_email: (existing.locker as { email: string } | null)?.email ?? undefined,
      } as ArticleLock,
    }
  }

  // No lock exists — create
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MIN * 60_000).toISOString()
  const { data: created, error } = await supabase
    .from('article_locks')
    .insert({ article_id: articleId, locked_by: userId, locked_at: now.toISOString(), expires_at: expiresAt })
    .select()
    .single()

  if (error) {
    // Race condition: another user inserted between our check and insert
    const { data: raced } = await supabase
      .from('article_locks')
      .select('*, locker:profiles!article_locks_locked_by_fkey(email)')
      .eq('article_id', articleId)
      .single()
    if (raced && raced.locked_by !== userId) {
      return {
        acquired: false,
        lock: { ...raced, locker_email: (raced.locker as { email: string } | null)?.email } as ArticleLock,
      }
    }
  }

  return { acquired: true, lock: created as ArticleLock }
}

/** Renew lock (heartbeat). Returns updated lock or null if not owner. */
export async function renewLock(articleId: string, userId: string): Promise<ArticleLock | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MIN * 60_000).toISOString()

  const { data, error } = await supabase
    .from('article_locks')
    .update({ expires_at: expiresAt })
    .eq('article_id', articleId)
    .eq('locked_by', userId)
    .select()
    .single()

  if (error || !data) return null
  return data as ArticleLock
}

/** Release lock. Only the owner can release. */
export async function releaseLock(articleId: string, userId: string): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()
  const { error } = await supabase
    .from('article_locks')
    .delete()
    .eq('article_id', articleId)
    .eq('locked_by', userId)
  return !error
}

/** Get current lock status. Returns null if unlocked or expired. */
export async function getLock(articleId: string): Promise<ArticleLock | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()
  const { data } = await supabase
    .from('article_locks')
    .select('*, locker:profiles!article_locks_locked_by_fkey(email)')
    .eq('article_id', articleId)
    .single()
  if (!data) return null

  const expiresAt = new Date(data.expires_at)
  if (expiresAt < new Date()) {
    // Expired — clean up
    await supabase.from('article_locks').delete().eq('article_id', articleId)
    return null
  }
  return {
    ...data,
    locker_email: (data.locker as { email: string } | null)?.email ?? undefined,
  } as ArticleLock
}
