import { and, desc, eq, gte, isNull, lte, or } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { announcements } from '../db/schema.js'
import { config } from '../config/env.js'
import type { CreateAnnouncementBody, UpdateAnnouncementBody } from '../schemas/announcements.js'

function rowToApi(row: typeof announcements.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    placement: row.placement,
    priority: row.priority,
    link_url: row.linkUrl,
    is_active: row.isActive,
    starts_at: row.startsAt?.toISOString() ?? null,
    ends_at: row.endsAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export async function listActiveAnnouncements() {
  if (!config.database) return []
  const db = getDb()
  const now = new Date()
  const rows = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.isActive, true),
        or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
        or(isNull(announcements.endsAt), gte(announcements.endsAt, now))
      )
    )
    .orderBy(desc(announcements.priority), desc(announcements.createdAt))
  return rows.map(rowToApi)
}

export async function listAnnouncementsAdmin() {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt))
  return rows.map(rowToApi)
}

export async function getAnnouncementById(id: string) {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1)
  return row ? rowToApi(row) : null
}

export async function createAnnouncement(body: CreateAnnouncementBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [row] = await db
    .insert(announcements)
    .values({
      title: body.title,
      body: body.body,
      placement: body.placement ?? 'banner',
      priority: body.priority ?? 0,
      linkUrl: body.link_url ?? null,
      isActive: body.is_active ?? true,
      startsAt: body.starts_at ? new Date(body.starts_at) : null,
      endsAt: body.ends_at ? new Date(body.ends_at) : null,
    })
    .returning()
  return rowToApi(row!)
}

export async function updateAnnouncement(id: string, body: UpdateAnnouncementBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: {
    updatedAt: Date
    title?: string
    body?: string
    placement?: (typeof announcements.$inferSelect)['placement']
    priority?: number
    linkUrl?: string | null
    isActive?: boolean
    startsAt?: Date | null
    endsAt?: Date | null
  } = { updatedAt: new Date() }
  if (body.title !== undefined) patch.title = body.title
  if (body.body !== undefined) patch.body = body.body
  if (body.placement !== undefined) patch.placement = body.placement
  if (body.priority !== undefined) patch.priority = body.priority
  if (body.link_url !== undefined) patch.linkUrl = body.link_url
  if (body.is_active !== undefined) patch.isActive = body.is_active
  if (body.starts_at !== undefined) patch.startsAt = body.starts_at ? new Date(body.starts_at) : null
  if (body.ends_at !== undefined) patch.endsAt = body.ends_at ? new Date(body.ends_at) : null

  const [row] = await db.update(announcements).set(patch).where(eq(announcements.id, id)).returning()
  return row ? rowToApi(row) : null
}

export async function deleteAnnouncement(id: string) {
  if (!config.database) return false
  const db = getDb()
  const res = await db.delete(announcements).where(eq(announcements.id, id)).returning({ id: announcements.id })
  return res.length > 0
}
