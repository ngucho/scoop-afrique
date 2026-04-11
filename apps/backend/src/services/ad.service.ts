import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { adCampaigns, adCreatives, adClicks, adImpressions, adSlots } from '../db/schema.js'
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

/** Public + legacy admin API mapping — aligned with `reader-platform` tables (`label`, `start_at`, creatives without `slot_id`). */
function slotToApi(row: typeof adSlots.$inferSelect) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    /** @deprecated use `label` */
    name: row.label,
    description: row.description,
    created_at: row.createdAt.toISOString(),
  }
}

function campaignToApi(row: typeof adCampaigns.$inferSelect) {
  return {
    id: row.id,
    slot_id: row.slotId,
    name: row.name,
    status: row.status,
    start_at: row.startAt?.toISOString() ?? null,
    end_at: row.endAt?.toISOString() ?? null,
    weight: row.weight,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    starts_at: row.startAt?.toISOString() ?? null,
    ends_at: row.endAt?.toISOString() ?? null,
    priority: row.weight,
    budget_cents: null as number | null,
    notes: null as string | null,
  }
}

function creativeToApi(row: typeof adCreatives.$inferSelect) {
  return {
    id: row.id,
    campaign_id: row.campaignId,
    headline: row.headline,
    body: row.body,
    image_url: row.imageUrl,
    link_url: row.linkUrl,
    alt: row.alt ?? null,
    cta_label: row.ctaLabel ?? null,
    video_url: row.videoUrl ?? null,
    format: row.creativeFormat,
    weight: row.weight,
    is_active: row.isActive,
    sort_order: row.sortOrder,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function sortCreatives(list: ReturnType<typeof creativeToApi>[]) {
  return [...list].sort((a, b) => {
    const so = a.sort_order - b.sort_order
    if (so !== 0) return so
    return (b.weight ?? 1) - (a.weight ?? 1)
  })
}

/* ---------- Public placements ---------- */

export async function getActivePlacements() {
  if (!config.database) return { slots: [], creatives_by_slot: {} as Record<string, ReturnType<typeof creativeToApi>[]> }
  const db = getDb()
  const now = new Date()

  const slotRows = await db.select().from(adSlots).orderBy(asc(adSlots.key))

  const campaignRows = await db
    .select()
    .from(adCampaigns)
    .where(
      and(
        eq(adCampaigns.status, 'active'),
        or(isNull(adCampaigns.startAt), lte(adCampaigns.startAt, now)),
        or(isNull(adCampaigns.endAt), gte(adCampaigns.endAt, now)),
      ),
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

  const campaignById = new Map(campaignRows.map((c) => [c.id, c]))
  const creativesBySlot: Record<string, ReturnType<typeof creativeToApi>[]> = {}

  for (const cr of creativeRows) {
    const camp = campaignById.get(cr.campaignId)
    if (!camp) continue
    const slotId = camp.slotId
    const list = creativesBySlot[slotId] ?? []
    list.push(creativeToApi(cr))
    creativesBySlot[slotId] = list
  }

  for (const sid of Object.keys(creativesBySlot)) {
    creativesBySlot[sid] = sortCreatives(creativesBySlot[sid]!)
  }

  return {
    slots: slotRows.map(slotToApi),
    creatives_by_slot: creativesBySlot,
  }
}

/* ---------- Slots CRUD (legacy `/admin/ads` — maps `name` → `label`) ---------- */

export async function listAdSlots() {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(adSlots).orderBy(asc(adSlots.key))
  return rows.map(slotToApi)
}

export async function createAdSlot(body: CreateAdSlotBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [row] = await db
    .insert(adSlots)
    .values({
      key: body.key,
      label: body.name,
      description: body.description ?? null,
    })
    .returning()
  return slotToApi(row!)
}

export async function updateAdSlot(id: string, body: UpdateAdSlotBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: Partial<typeof adSlots.$inferInsert> = {}
  if (body.name !== undefined) patch.label = body.name
  if (body.description !== undefined) patch.description = body.description
  if (Object.keys(patch).length === 0) {
    const [r] = await db.select().from(adSlots).where(eq(adSlots.id, id))
    return r ? slotToApi(r) : null
  }
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
  const weight = body.weight ?? body.priority ?? 1
  const [row] = await db
    .insert(adCampaigns)
    .values({
      slotId: body.slot_id,
      name: body.name,
      status: body.status ?? 'draft',
      startAt: body.starts_at ? new Date(body.starts_at) : null,
      endAt: body.ends_at ? new Date(body.ends_at) : null,
      weight,
    })
    .returning()
  return campaignToApi(row!)
}

export async function updateAdCampaign(id: string, body: UpdateAdCampaignBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: Partial<typeof adCampaigns.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() }
  if (body.slot_id !== undefined) patch.slotId = body.slot_id
  if (body.name !== undefined) patch.name = body.name
  if (body.status !== undefined) patch.status = body.status
  if (body.starts_at !== undefined) patch.startAt = body.starts_at ? new Date(body.starts_at) : null
  if (body.ends_at !== undefined) patch.endAt = body.ends_at ? new Date(body.ends_at) : null
  if (body.weight !== undefined) patch.weight = body.weight
  if (body.priority !== undefined) patch.weight = body.priority
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
    ? await db
        .select()
        .from(adCreatives)
        .where(eq(adCreatives.campaignId, campaignId))
        .orderBy(asc(adCreatives.sortOrder), desc(adCreatives.createdAt))
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
      headline: body.headline,
      body: body.body ?? null,
      imageUrl: body.image_url ?? null,
      linkUrl: body.link_url,
      creativeFormat: body.format ?? 'native',
      ctaLabel: body.cta_label ?? null,
      videoUrl: body.video_url ?? null,
      alt: body.alt ?? null,
      weight: body.weight ?? 1,
      isActive: body.is_active ?? true,
      sortOrder: body.sort_order ?? 0,
    })
    .returning()
  return creativeToApi(row!)
}

export async function updateAdCreative(id: string, body: UpdateAdCreativeBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: Partial<typeof adCreatives.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() }
  if (body.headline !== undefined) patch.headline = body.headline
  if (body.body !== undefined) patch.body = body.body
  if (body.image_url !== undefined) patch.imageUrl = body.image_url
  if (body.link_url !== undefined) patch.linkUrl = body.link_url
  if (body.format !== undefined) patch.creativeFormat = body.format
  if (body.cta_label !== undefined) patch.ctaLabel = body.cta_label
  if (body.video_url !== undefined) patch.videoUrl = body.video_url
  if (body.alt !== undefined) patch.alt = body.alt
  if (body.weight !== undefined) patch.weight = body.weight
  if (body.is_active !== undefined) patch.isActive = body.is_active
  if (body.sort_order !== undefined) patch.sortOrder = body.sort_order
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
