import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { subscriberPreferences, subscriberProfiles, subscriberSegments } from '../db/schema.js'
import { config } from '../config/env.js'
import type {
  CreateSubscriberProfileBody,
  CreateSubscriberSegmentBody,
  UpdateSubscriberProfileBody,
  UpdateSubscriberSegmentBody,
  UpsertSubscriberPreferencesBody,
} from '../schemas/subscribers.js'

function segmentToApi(row: typeof subscriberSegments.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    filter: row.filter as Record<string, unknown>,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function profileToApi(
  row: typeof subscriberProfiles.$inferSelect,
  prefs: typeof subscriberPreferences.$inferSelect | null
) {
  return {
    id: row.id,
    profile_id: row.profileId,
    newsletter_subscriber_id: row.newsletterSubscriberId,
    display_name: row.displayName,
    preferences: prefs
      ? {
          frequency: prefs.frequency,
          category_ids: prefs.categoryIds,
          updated_at: prefs.updatedAt.toISOString(),
        }
      : null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export async function listSegments() {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(subscriberSegments)
  return rows.map(segmentToApi)
}

export async function createSegment(body: CreateSubscriberSegmentBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [row] = await db
    .insert(subscriberSegments)
    .values({
      name: body.name,
      description: body.description ?? null,
      filter: body.filter ?? {},
    })
    .returning()
  return segmentToApi(row!)
}

export async function updateSegment(id: string, body: UpdateSubscriberSegmentBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: {
    updatedAt: Date
    name?: string
    description?: string | null
    filter?: Record<string, unknown>
  } = { updatedAt: new Date() }
  if (body.name !== undefined) patch.name = body.name
  if (body.description !== undefined) patch.description = body.description
  if (body.filter !== undefined) patch.filter = body.filter
  const [row] = await db.update(subscriberSegments).set(patch).where(eq(subscriberSegments.id, id)).returning()
  return row ? segmentToApi(row) : null
}

export async function deleteSegment(id: string) {
  if (!config.database) return false
  const db = getDb()
  const res = await db.delete(subscriberSegments).where(eq(subscriberSegments.id, id)).returning({ id: subscriberSegments.id })
  return res.length > 0
}

export async function listProfiles() {
  if (!config.database) return []
  const db = getDb()
  const profiles = await db.select().from(subscriberProfiles)
  const prefsRows = await db.select().from(subscriberPreferences)
  const prefByProfile = new Map(prefsRows.map((p) => [p.subscriberProfileId, p]))
  return profiles.map((p) => profileToApi(p, prefByProfile.get(p.id) ?? null))
}

export async function getProfileById(id: string) {
  if (!config.database) return null
  const db = getDb()
  const [p] = await db.select().from(subscriberProfiles).where(eq(subscriberProfiles.id, id)).limit(1)
  if (!p) return null
  const [pref] = await db
    .select()
    .from(subscriberPreferences)
    .where(eq(subscriberPreferences.subscriberProfileId, id))
    .limit(1)
  return profileToApi(p, pref ?? null)
}

export async function createProfile(body: CreateSubscriberProfileBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [row] = await db
    .insert(subscriberProfiles)
    .values({
      profileId: body.profile_id,
      newsletterSubscriberId: body.newsletter_subscriber_id ?? null,
      displayName: body.display_name ?? null,
    })
    .returning()
  return profileToApi(row!, null)
}

export async function updateProfile(id: string, body: UpdateSubscriberProfileBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: {
    updatedAt: Date
    newsletterSubscriberId?: string | null
    displayName?: string | null
  } = { updatedAt: new Date() }
  if (body.newsletter_subscriber_id !== undefined) patch.newsletterSubscriberId = body.newsletter_subscriber_id
  if (body.display_name !== undefined) patch.displayName = body.display_name
  const [row] = await db.update(subscriberProfiles).set(patch).where(eq(subscriberProfiles.id, id)).returning()
  if (!row) return null
  const [pref] = await db
    .select()
    .from(subscriberPreferences)
    .where(eq(subscriberPreferences.subscriberProfileId, id))
    .limit(1)
  return profileToApi(row, pref ?? null)
}

export async function deleteProfile(id: string) {
  if (!config.database) return false
  const db = getDb()
  const res = await db.delete(subscriberProfiles).where(eq(subscriberProfiles.id, id)).returning({ id: subscriberProfiles.id })
  return res.length > 0
}

export async function upsertPreferences(subscriberProfileId: string, body: UpsertSubscriberPreferencesBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [existing] = await db
    .select()
    .from(subscriberPreferences)
    .where(eq(subscriberPreferences.subscriberProfileId, subscriberProfileId))
    .limit(1)
  if (existing) {
    const [row] = await db
      .update(subscriberPreferences)
      .set({
        frequency: body.frequency,
        categoryIds: body.category_ids,
        updatedAt: new Date(),
      })
      .where(eq(subscriberPreferences.id, existing.id))
      .returning()
    return row!
  }
  const [row] = await db
    .insert(subscriberPreferences)
    .values({
      subscriberProfileId,
      frequency: body.frequency,
      categoryIds: body.category_ids,
    })
    .returning()
  return row!
}
