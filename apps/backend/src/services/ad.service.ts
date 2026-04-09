import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import {
  adCampaigns,
  adClicks,
  adCreatives,
  adImpressions,
  adSlots,
} from '../db/schema.js'
import { config } from '../config/env.js'
import type {
  CreateAdCampaignBody,
  CreateAdCreativeBody,
  CreateAdSlotBody,
  RecordAdEventBody,
  UpdateAdCampaignBody,
  UpdateAdCreativeBody,
  UpdateAdSlotBody,
} from '../schemas/ads.js'

function slotToApi(row: typeof adSlots.$inferSelect) {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    format: row.format,
    is_active: row.isActive,
    sort_order: row.sortOrder,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function campaignToApi(row: typeof adCampaigns.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    starts_at: row.startsAt?.toISOString() ?? null,
    ends_at: row.endsAt?.toISOString() ?? null,
    priority: row.priority,
    budget_cents: row.budgetCents,
    notes: row.notes,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function creativeToApi(row: typeof adCreatives.$inferSelect) {
  return {
    id: row.id,
    campaign_id: row.campaignId,
    slot_id: row.slotId,
    image_url: row.imageUrl,
    link_url: row.linkUrl,
    alt: row.alt,
    weight: row.weight,
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

/* ---------- Public placements ---------- */

export async function getActivePlacements() {
  if (!config.database) return { slots: [], creatives_by_slot: {} as Record<string, ReturnType<typeof creativeToApi>[]> }
  const db = getDb()
  const now = new Date()

  const slotRows = await db
    .select()
    .from(adSlots)
    .where(eq(adSlots.isActive, true))
    .orderBy(asc(adSlots.sortOrder), asc(adSlots.name))

  const campaignRows = await db
    .select()
    .from(adCampaigns)
    .where(
      and(
        eq(adCampaigns.status, 'active'),
        or(isNull(adCampaigns.startsAt), lte(adCampaigns.startsAt, now)),
        or(isNull(adCampaigns.endsAt), gte(adCampaigns.endsAt, now))
      )
    )

  const campaignIds = campaignRows.map((c) => c.id)
  if (campaignIds.length === 0) {
    return {
      slots: slotRows.map(slotToApi),
      creatives_by_slot: {} as Record<string, ReturnType<typeof creativeToApi>[]>,
    }
  }

  const creativeRows = await db
    .select()
    .from(adCreatives)
    .where(and(inArray(adCreatives.campaignId, campaignIds), eq(adCreatives.isActive, true)))

  const creativesBySlot: Record<string, ReturnType<typeof creativeToApi>[]> = {}
  for (const cr of creativeRows) {
    const list = creativesBySlot[cr.slotId] ?? []
    list.push(creativeToApi(cr))
    creativesBySlot[cr.slotId] = list
  }

  return {
    slots: slotRows.map(slotToApi),
    creatives_by_slot: creativesBySlot,
  }
}

/* ---------- Slots CRUD ---------- */

export async function listAdSlots() {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(adSlots).orderBy(asc(adSlots.sortOrder), asc(adSlots.name))
  return rows.map(slotToApi)
}

export async function createAdSlot(body: CreateAdSlotBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [row] = await db
    .insert(adSlots)
    .values({
      key: body.key,
      name: body.name,
      description: body.description ?? null,
      format: body.format ?? null,
      isActive: body.is_active ?? true,
      sortOrder: body.sort_order ?? 0,
    })
    .returning()
  return slotToApi(row!)
}

export async function updateAdSlot(id: string, body: UpdateAdSlotBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: {
    updatedAt: Date
    name?: string
    description?: string | null
    format?: string | null
    isActive?: boolean
    sortOrder?: number
  } = { updatedAt: new Date() }
  if (body.name !== undefined) patch.name = body.name
  if (body.description !== undefined) patch.description = body.description
  if (body.format !== undefined) patch.format = body.format
  if (body.is_active !== undefined) patch.isActive = body.is_active
  if (body.sort_order !== undefined) patch.sortOrder = body.sort_order
  const [row] = await db.update(adSlots).set(patch).where(eq(adSlots.id, id)).returning()
  return row ? slotToApi(row) : null
}

export async function deleteAdSlot(id: string) {
  if (!config.database) return false
  const db = getDb()
  const res = await db.delete(adSlots).where(eq(adSlots.id, id)).returning({ id: adSlots.id })
  return res.length > 0
}

/* ---------- Campaigns CRUD ---------- */

export async function listAdCampaigns() {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt))
  return rows.map(campaignToApi)
}

export async function createAdCampaign(body: CreateAdCampaignBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [row] = await db
    .insert(adCampaigns)
    .values({
      name: body.name,
      status: body.status ?? 'draft',
      startsAt: body.starts_at ? new Date(body.starts_at) : null,
      endsAt: body.ends_at ? new Date(body.ends_at) : null,
      priority: body.priority ?? 0,
      budgetCents: body.budget_cents ?? null,
      notes: body.notes ?? null,
    })
    .returning()
  return campaignToApi(row!)
}

export async function updateAdCampaign(id: string, body: UpdateAdCampaignBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: {
    updatedAt: Date
    name?: string
    status?: (typeof adCampaigns.$inferSelect)['status']
    startsAt?: Date | null
    endsAt?: Date | null
    priority?: number
    budgetCents?: number | null
    notes?: string | null
  } = { updatedAt: new Date() }
  if (body.name !== undefined) patch.name = body.name
  if (body.status !== undefined) patch.status = body.status
  if (body.starts_at !== undefined) patch.startsAt = body.starts_at ? new Date(body.starts_at) : null
  if (body.ends_at !== undefined) patch.endsAt = body.ends_at ? new Date(body.ends_at) : null
  if (body.priority !== undefined) patch.priority = body.priority
  if (body.budget_cents !== undefined) patch.budgetCents = body.budget_cents
  if (body.notes !== undefined) patch.notes = body.notes
  const [row] = await db.update(adCampaigns).set(patch).where(eq(adCampaigns.id, id)).returning()
  return row ? campaignToApi(row) : null
}

export async function deleteAdCampaign(id: string) {
  if (!config.database) return false
  const db = getDb()
  const res = await db.delete(adCampaigns).where(eq(adCampaigns.id, id)).returning({ id: adCampaigns.id })
  return res.length > 0
}

/* ---------- Creatives CRUD ---------- */

export async function listAdCreatives(campaignId?: string) {
  if (!config.database) return []
  const db = getDb()
  const rows = campaignId
    ? await db.select().from(adCreatives).where(eq(adCreatives.campaignId, campaignId)).orderBy(desc(adCreatives.createdAt))
    : await db.select().from(adCreatives).orderBy(desc(adCreatives.createdAt))
  return rows.map(creativeToApi)
}

export async function createAdCreative(body: CreateAdCreativeBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [row] = await db
    .insert(adCreatives)
    .values({
      campaignId: body.campaign_id,
      slotId: body.slot_id,
      imageUrl: body.image_url,
      linkUrl: body.link_url,
      alt: body.alt ?? null,
      weight: body.weight ?? 1,
      isActive: body.is_active ?? true,
    })
    .returning()
  return creativeToApi(row!)
}

export async function updateAdCreative(id: string, body: UpdateAdCreativeBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: {
    updatedAt: Date
    slotId?: string
    imageUrl?: string
    linkUrl?: string
    alt?: string | null
    weight?: number
    isActive?: boolean
  } = { updatedAt: new Date() }
  if (body.slot_id !== undefined) patch.slotId = body.slot_id
  if (body.image_url !== undefined) patch.imageUrl = body.image_url
  if (body.link_url !== undefined) patch.linkUrl = body.link_url
  if (body.alt !== undefined) patch.alt = body.alt
  if (body.weight !== undefined) patch.weight = body.weight
  if (body.is_active !== undefined) patch.isActive = body.is_active
  const [row] = await db.update(adCreatives).set(patch).where(eq(adCreatives.id, id)).returning()
  return row ? creativeToApi(row) : null
}

export async function deleteAdCreative(id: string) {
  if (!config.database) return false
  const db = getDb()
  const res = await db.delete(adCreatives).where(eq(adCreatives.id, id)).returning({ id: adCreatives.id })
  return res.length > 0
}

/* ---------- Events ---------- */

export async function recordImpression(body: RecordAdEventBody) {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .insert(adImpressions)
    .values({
      creativeId: body.creative_id,
      sessionId: body.session_id ?? null,
      articleId: body.article_id ?? null,
      userAgent: body.user_agent ?? null,
      metadata: body.metadata ?? {},
    })
    .returning({ id: adImpressions.id })
  return row
}

export async function recordClick(body: RecordAdEventBody) {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .insert(adClicks)
    .values({
      creativeId: body.creative_id,
      sessionId: body.session_id ?? null,
      articleId: body.article_id ?? null,
      metadata: body.metadata ?? {},
    })
    .returning({ id: adClicks.id })
  return row
}
