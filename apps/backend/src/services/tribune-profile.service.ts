/**
 * Public Tribune profile lookup by pseudo.
 */
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { profiles, readerPublicProfiles } from '../db/schema.js'
import { config } from '../config/env.js'

export interface TribunePublicProfile {
  profile_id: string
  auth0_sub: string
  pseudo: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
}

export async function getTribuneProfileByPseudo(pseudo: string): Promise<TribunePublicProfile | null> {
  if (!config.database) return null
  const db = getDb()
  const q = pseudo.trim()
  if (q.length < 2) return null

  const [row] = await db
    .select({
      profileId: profiles.id,
      auth0Id: profiles.auth0Id,
      email: profiles.email,
      pseudo: readerPublicProfiles.pseudo,
      displayName: readerPublicProfiles.displayName,
      avatarUrl: readerPublicProfiles.avatarUrl,
      bio: readerPublicProfiles.bio,
    })
    .from(readerPublicProfiles)
    .innerJoin(profiles, eq(readerPublicProfiles.auth0Sub, profiles.auth0Id))
    .where(sql`lower(trim(${readerPublicProfiles.pseudo})) = lower(${q})`)
    .limit(1)

  if (!row?.profileId || !row.auth0Id) return null

  return {
    profile_id: row.profileId,
    auth0_sub: row.auth0Id,
    pseudo: row.pseudo,
    display_name: row.displayName,
    avatar_url: row.avatarUrl,
    bio: row.bio,
    email: row.email,
  }
}
