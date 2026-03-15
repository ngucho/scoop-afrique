/**
 * Profile service — get-or-create profiles from Auth0 JWT.
 *
 * Auth0 is the sole IAM. Personal data (name, picture, etc.) stays in Auth0.
 * Profiles store only: id, auth0_id, email, role (business identity).
 * Business data (articles, comments, media) link to profiles via id; email is the stable user identifier.
 */
import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { profiles } from '../db/schema.js'
import { config } from '../config/env.js'
import { profileCache } from '../lib/cache.js'

export type AppRole = 'journalist' | 'editor' | 'manager' | 'admin'

export interface Profile {
  id: string
  auth0_id: string
  email: string | null
  role: AppRole
  created_at: string
  updated_at: string
}

export interface Auth0UserInfo {
  sub: string
  email: string
  role: AppRole
}

function toProfile(row: { id: string; auth0Id: string | null; email: string | null; role: AppRole; createdAt: Date; updatedAt: Date }): Profile {
  return {
    id: row.id,
    auth0_id: row.auth0Id ?? row.id,
    email: row.email,
    role: row.role,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

/**
 * Get or create a profile from Auth0 user info.
 * Only stores id, auth0_id, email, role.
 */
export async function getOrCreateProfile(info: Auth0UserInfo): Promise<Profile> {
  if (!config.database) {
    return {
      id: info.sub,
      auth0_id: info.sub,
      email: info.email,
      role: info.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const cacheKey = `profile:${info.sub}`
  const cached = profileCache.get(cacheKey) as Profile | undefined
  if (cached) {
    const needsSync = cached.role !== info.role || cached.email !== info.email
    if (!needsSync) return cached

    const db = getDb()
    const [updated] = await db
      .update(profiles)
      .set({ role: info.role, email: info.email, updatedAt: new Date() })
      .where(eq(profiles.id, cached.id))
      .returning()

    const result = updated ? toProfile(updated) : cached
    profileCache.set(cacheKey, result)
    return result
  }

  const db = getDb()
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.auth0Id, info.sub))
    .limit(1)

  if (existing) {
    const needsUpdate = existing.role !== info.role || (existing.email ?? null) !== info.email
    if (needsUpdate) {
      const [updated] = await db
        .update(profiles)
        .set({ role: info.role, email: info.email, updatedAt: new Date() })
        .where(eq(profiles.id, existing.id))
        .returning()
      const result = updated ? toProfile(updated) : toProfile(existing)
      profileCache.set(cacheKey, result)
      return result
    }
    const result = toProfile(existing)
    profileCache.set(cacheKey, result)
    return result
  }

  const [created] = await db
    .insert(profiles)
    .values({
      auth0Id: info.sub,
      email: info.email,
      role: info.role,
    })
    .returning()

  if (!created) throw new Error('Failed to create profile')
  const result = toProfile(created)
  profileCache.set(cacheKey, result)
  return result
}

/** Get profile by UUID (for joins). Cached. */
export async function getProfileById(id: string): Promise<Profile | null> {
  if (!config.database) return null

  const cacheKey = `profile:id:${id}`
  const cached = profileCache.get(cacheKey) as Profile | undefined
  if (cached) return cached

  const db = getDb()
  const [row] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1)
  if (row) {
    const p = toProfile(row)
    profileCache.set(cacheKey, p)
    return p
  }
  return null
}
