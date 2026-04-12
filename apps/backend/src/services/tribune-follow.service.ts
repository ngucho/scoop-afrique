/**
 * Tribune social graph — follow / unfollow between reader profiles.
 */
import { and, count, desc, eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { profiles, readerPublicProfiles, tribuneFollows } from '../db/schema.js'
import { config } from '../config/env.js'

export async function followProfile(followerProfileId: string, followingProfileId: string): Promise<boolean> {
  if (!config.database || followerProfileId === followingProfileId) return false
  const db = getDb()
  try {
    await db.insert(tribuneFollows).values({
      followerProfileId,
      followingProfileId,
    })
    return true
  } catch {
    return false
  }
}

export async function unfollowProfile(followerProfileId: string, followingProfileId: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [del] = await db
    .delete(tribuneFollows)
    .where(
      and(
        eq(tribuneFollows.followerProfileId, followerProfileId),
        eq(tribuneFollows.followingProfileId, followingProfileId),
      ),
    )
    .returning({ a: tribuneFollows.followerProfileId })
  return !!del
}

export async function isFollowing(followerProfileId: string, followingProfileId: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [r] = await db
    .select({ a: tribuneFollows.followerProfileId })
    .from(tribuneFollows)
    .where(
      and(
        eq(tribuneFollows.followerProfileId, followerProfileId),
        eq(tribuneFollows.followingProfileId, followingProfileId),
      ),
    )
    .limit(1)
  return !!r
}

export async function countFollowers(profileId: string): Promise<number> {
  if (!config.database) return 0
  const db = getDb()
  const [r] = await db
    .select({ c: count() })
    .from(tribuneFollows)
    .where(eq(tribuneFollows.followingProfileId, profileId))
  return Number(r?.c ?? 0)
}

export async function countFollowing(profileId: string): Promise<number> {
  if (!config.database) return 0
  const db = getDb()
  const [r] = await db
    .select({ c: count() })
    .from(tribuneFollows)
    .where(eq(tribuneFollows.followerProfileId, profileId))
  return Number(r?.c ?? 0)
}

export interface TribuneFollowListRow {
  profile_id: string
  pseudo: string | null
  display_name: string | null
  avatar_url: string | null
  auth0_sub: string | null
  followed_at: string
}

export async function listFollowersOf(profileId: string, limit = 100): Promise<TribuneFollowListRow[]> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select({
      profileId: profiles.id,
      auth0Id: profiles.auth0Id,
      email: profiles.email,
      pseudo: readerPublicProfiles.pseudo,
      displayName: readerPublicProfiles.displayName,
      avatarUrl: readerPublicProfiles.avatarUrl,
      createdAt: tribuneFollows.createdAt,
    })
    .from(tribuneFollows)
    .innerJoin(profiles, eq(tribuneFollows.followerProfileId, profiles.id))
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .where(eq(tribuneFollows.followingProfileId, profileId))
    .orderBy(desc(tribuneFollows.createdAt))
    .limit(Math.min(limit, 200))

  return rows.map((r) => ({
    profile_id: r.profileId,
    pseudo: r.pseudo,
    display_name: r.displayName,
    avatar_url: r.avatarUrl,
    auth0_sub: r.auth0Id,
    followed_at: r.createdAt.toISOString(),
  }))
}

export async function listFollowingBy(profileId: string, limit = 100): Promise<TribuneFollowListRow[]> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select({
      profileId: profiles.id,
      auth0Id: profiles.auth0Id,
      pseudo: readerPublicProfiles.pseudo,
      displayName: readerPublicProfiles.displayName,
      avatarUrl: readerPublicProfiles.avatarUrl,
      createdAt: tribuneFollows.createdAt,
    })
    .from(tribuneFollows)
    .innerJoin(profiles, eq(tribuneFollows.followingProfileId, profiles.id))
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .where(eq(tribuneFollows.followerProfileId, profileId))
    .orderBy(desc(tribuneFollows.createdAt))
    .limit(Math.min(limit, 200))

  return rows.map((r) => ({
    profile_id: r.profileId,
    pseudo: r.pseudo,
    display_name: r.displayName,
    avatar_url: r.avatarUrl,
    auth0_sub: r.auth0Id,
    followed_at: r.createdAt.toISOString(),
  }))
}
