/**
 * Reader platform backoffice — announcements, ads, homepage, subscribers, newsletter campaigns, KPIs.
 */
import { and, asc, count, desc, eq, gte, ilike, sql } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import {
  adCampaigns,
  adCreatives,
  adClicks,
  adImpressions,
  adSlots,
  adminAuditLog,
  articles,
  categories,
  newsletterCampaigns,
  homepageSections,
  newsletterSubscribers,
  readerAnnouncements,
} from '../db/schema.js'
import { getLatestAudienceMetricsByKey } from './audience-metric.service.js'
import type { AppRole } from './profile.service.js'

function rowsFromExecute<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: T[] }).rows
  }
  return []
}

/* ---------- Audit ---------- */

export async function appendAudit(entry: {
  actorId: string | null
  entityType: string
  entityId: string | null
  action: string
  reason?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  const db = getDb()
  await db.insert(adminAuditLog).values({
    actorId: entry.actorId ?? undefined,
    entityType: entry.entityType,
    entityId: entry.entityId ?? undefined,
    action: entry.action,
    reason: entry.reason ?? undefined,
    metadata: entry.metadata ?? {},
  })
}

/* ---------- Dashboard KPIs ---------- */

export interface ReaderDashboardKpis {
  subscriberGrowth: { week_start: string; new_subscribers: number }[]
  adCtrBySlot: { slot_key: string; impressions: number; clicks: number; ctr: number | null }[]
  topCategories: { category_id: string | null; name: string; slug: string | null; article_count: number; total_views: number }[]
  topArticles: { id: string; title: string; slug: string; view_count: number; category_slug: string | null }[]
  newsletterTotals: { confirmed: number; pending: number; unsubscribed: number }
  /** Latest ingested audience / social / site KPI snapshots (if any). */
  audienceLatest: {
    platform: string
    metric_key: string
    snapshot_date: string
    value_numeric: string
    country_code: string
  }[]
}

export interface ReaderAdSlotMetricsRow {
  slot_key: string
  impressions: number
  clicks: number
  ctr: number | null
}

export async function getReaderDashboardKpis(): Promise<ReaderDashboardKpis> {
  const db = getDb()
  const since = new Date()
  since.setDate(since.getDate() - 84)

  const growthRaw = await db.execute(sql`
    SELECT date_trunc('week', subscribed_at)::date::text AS week_start,
           COUNT(*)::int AS new_subscribers
    FROM newsletter_subscribers
    WHERE subscribed_at >= ${since}
    GROUP BY 1
    ORDER BY 1 ASC
  `)
  const growthRows = rowsFromExecute<{ week_start: string; new_subscribers: number }>(growthRaw)

  const sinceAds = new Date()
  sinceAds.setDate(sinceAds.getDate() - 30)

  const [impAgg, clkAgg] = await Promise.all([
    db
      .select({
        slot_key: adSlots.key,
        n: count(adImpressions.id),
      })
      .from(adImpressions)
      .innerJoin(adCreatives, eq(adImpressions.creativeId, adCreatives.id))
      .innerJoin(adCampaigns, eq(adCreatives.campaignId, adCampaigns.id))
      .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
      .where(gte(adImpressions.occurredAt, sinceAds))
      .groupBy(adSlots.key),
    db
      .select({
        slot_key: adSlots.key,
        n: count(adClicks.id),
      })
      .from(adClicks)
      .innerJoin(adCreatives, eq(adClicks.creativeId, adCreatives.id))
      .innerJoin(adCampaigns, eq(adCreatives.campaignId, adCampaigns.id))
      .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
      .where(gte(adClicks.occurredAt, sinceAds))
      .groupBy(adSlots.key),
  ])

  const impMap = new Map(impAgg.map((r) => [r.slot_key, Number(r.n)]))
  const clkMap = new Map(clkAgg.map((r) => [r.slot_key, Number(r.n)]))
  const slotKeys = new Set([...impMap.keys(), ...clkMap.keys()])
  const ctrRows = [...slotKeys].sort().map((slot_key) => ({
    slot_key,
    impressions: impMap.get(slot_key) ?? 0,
    clicks: clkMap.get(slot_key) ?? 0,
  }))

  const catRaw = await db.execute(sql`
    SELECT c.id AS category_id, c.name, c.slug,
           count(a.id)::int AS article_count,
           coalesce(sum(a.view_count), 0)::int AS total_views
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
    GROUP BY c.id, c.name, c.slug
    ORDER BY total_views DESC
    LIMIT 8
  `)
  const catRows = rowsFromExecute<{
    category_id: string | null
    name: string | null
    slug: string | null
    article_count: number
    total_views: number
  }>(catRaw)

  const topArt = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      view_count: articles.viewCount,
      category_slug: categories.slug,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.viewCount))
    .limit(10)

  const [conf, pend, unsub, audienceLatest] = await Promise.all([
    db.select({ c: count() }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'confirmed')),
    db.select({ c: count() }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'pending')),
    db.select({ c: count() }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'unsubscribed')),
    getLatestAudienceMetricsByKey(),
  ])

  return {
    subscriberGrowth: growthRows.map((r) => ({
      week_start: r.week_start,
      new_subscribers: Number(r.new_subscribers),
    })),
    adCtrBySlot: ctrRows.map((r) => {
      const imp = r.impressions
      const clk = r.clicks
      return {
        slot_key: r.slot_key,
        impressions: imp,
        clicks: clk,
        ctr: imp > 0 ? clk / imp : null,
      }
    }),
    topCategories: catRows.map((r) => ({
      category_id: r.category_id,
      name: r.name ?? 'Sans catégorie',
      slug: r.slug,
      article_count: Number(r.article_count),
      total_views: Number(r.total_views),
    })),
    topArticles: topArt.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      view_count: a.view_count,
      category_slug: a.category_slug,
    })),
    newsletterTotals: {
      confirmed: conf[0]?.c ?? 0,
      pending: pend[0]?.c ?? 0,
      unsubscribed: unsub[0]?.c ?? 0,
    },
    audienceLatest: audienceLatest.map((a) => ({
      platform: a.platform,
      metric_key: a.metric_key,
      snapshot_date: a.snapshot_date,
      value_numeric: a.value_numeric,
      country_code: a.country_code ?? '',
    })),
  }
}

/** Impressions & clicks by placement key (`ad_impressions` / `ad_clicks`), for admin reporting. */
export async function getReaderAdMetrics(days: number): Promise<{
  days: number
  by_slot: ReaderAdSlotMetricsRow[]
  totals: { impressions: number; clicks: number; ctr: number | null }
}> {
  const db = getDb()
  const d = Math.min(Math.max(days, 1), 366)
  const since = new Date()
  since.setDate(since.getDate() - d)

  const [impAgg, clkAgg] = await Promise.all([
    db
      .select({
        slot_key: adSlots.key,
        n: count(adImpressions.id),
      })
      .from(adImpressions)
      .innerJoin(adCreatives, eq(adImpressions.creativeId, adCreatives.id))
      .innerJoin(adCampaigns, eq(adCreatives.campaignId, adCampaigns.id))
      .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
      .where(gte(adImpressions.occurredAt, since))
      .groupBy(adSlots.key),
    db
      .select({
        slot_key: adSlots.key,
        n: count(adClicks.id),
      })
      .from(adClicks)
      .innerJoin(adCreatives, eq(adClicks.creativeId, adCreatives.id))
      .innerJoin(adCampaigns, eq(adCreatives.campaignId, adCampaigns.id))
      .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
      .where(gte(adClicks.occurredAt, since))
      .groupBy(adSlots.key),
  ])

  const impMap = new Map(impAgg.map((r) => [r.slot_key, Number(r.n)]))
  const clkMap = new Map(clkAgg.map((r) => [r.slot_key, Number(r.n)]))
  const keys = new Set([...impMap.keys(), ...clkMap.keys()])
  const by_slot: ReaderAdSlotMetricsRow[] = [...keys].sort().map((slot_key) => {
    const impressions = impMap.get(slot_key) ?? 0
    const clicks = clkMap.get(slot_key) ?? 0
    return {
      slot_key,
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : null,
    }
  })

  const totals = by_slot.reduce(
    (acc, r) => {
      acc.impressions += r.impressions
      acc.clicks += r.clicks
      return acc
    },
    { impressions: 0, clicks: 0 },
  )

  return {
    days: d,
    by_slot,
    totals: {
      ...totals,
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : null,
    },
  }
}

/* ---------- Announcements ---------- */

export async function listAnnouncements() {
  const db = getDb()
  return db.select().from(readerAnnouncements).orderBy(desc(readerAnnouncements.updatedAt))
}

export async function createAnnouncement(
  data: {
    title: string
    body: string
    audience: 'all' | 'subscribers' | 'guests'
    link_url?: string | null
    placement?: 'banner' | 'modal' | 'inline' | 'footer' | 'sidebar'
    priority?: number
    starts_at: string | null
    ends_at: string | null
    is_active: boolean
  },
  userId: string
) {
  const db = getDb()
  const [row] = await db
    .insert(readerAnnouncements)
    .values({
      title: data.title,
      body: data.body,
      audience: data.audience,
      linkUrl: data.link_url ?? null,
      placement: data.placement ?? 'banner',
      priority: data.priority ?? 0,
      startsAt: data.starts_at ? new Date(data.starts_at) : null,
      endsAt: data.ends_at ? new Date(data.ends_at) : null,
      isActive: data.is_active,
      createdBy: userId,
    })
    .returning()
  return row
}

export async function updateAnnouncement(
  id: string,
  data: Partial<{
    title: string
    body: string
    audience: 'all' | 'subscribers' | 'guests'
    link_url: string | null
    placement: 'banner' | 'modal' | 'inline' | 'footer' | 'sidebar'
    priority: number
    starts_at: string | null
    ends_at: string | null
    is_active: boolean
  }>
) {
  const db = getDb()
  const [row] = await db
    .update(readerAnnouncements)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.audience !== undefined ? { audience: data.audience } : {}),
      ...(data.link_url !== undefined ? { linkUrl: data.link_url } : {}),
      ...(data.placement !== undefined ? { placement: data.placement } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.starts_at !== undefined
        ? { startsAt: data.starts_at ? new Date(data.starts_at) : null }
        : {}),
      ...(data.ends_at !== undefined ? { endsAt: data.ends_at ? new Date(data.ends_at) : null } : {}),
      ...(data.is_active !== undefined ? { isActive: data.is_active } : {}),
      updatedAt: new Date(),
    })
    .where(eq(readerAnnouncements.id, id))
    .returning()
  return row ?? null
}

export async function deleteAnnouncement(id: string) {
  const db = getDb()
  const r = await db.delete(readerAnnouncements).where(eq(readerAnnouncements.id, id)).returning({ id: readerAnnouncements.id })
  return r.length > 0
}

/* ---------- Ad slots & campaigns ---------- */

export async function listAdSlots() {
  const db = getDb()
  return db.select().from(adSlots).orderBy(asc(adSlots.key))
}

export async function getAdCampaignById(id: string) {
  const db = getDb()
  const [row] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, id)).limit(1)
  return row ?? null
}

export async function listAdCampaignsWithCreatives() {
  const db = getDb()
  const camps = await db.select().from(adCampaigns).orderBy(desc(adCampaigns.updatedAt))
  const creatives = await db.select().from(adCreatives).orderBy(asc(adCreatives.sortOrder))
  const byCamp = new Map<string, typeof creatives>()
  for (const c of creatives) {
    const list = byCamp.get(c.campaignId) ?? []
    list.push(c)
    byCamp.set(c.campaignId, list)
  }
  return camps.map((c) => ({
    ...c,
    creatives: byCamp.get(c.id) ?? [],
  }))
}

export async function createAdCampaign(data: {
  slot_id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'ended'
  start_at: string | null
  end_at: string | null
  weight: number
  userId: string
}) {
  const db = getDb()
  const [row] = await db
    .insert(adCampaigns)
    .values({
      slotId: data.slot_id,
      name: data.name,
      status: data.status,
      startAt: data.start_at ? new Date(data.start_at) : null,
      endAt: data.end_at ? new Date(data.end_at) : null,
      weight: data.weight,
      createdBy: data.userId,
    })
    .returning()
  return row
}

export async function updateAdCampaign(
  id: string,
  data: Partial<{
    slot_id: string
    name: string
    status: 'draft' | 'active' | 'paused' | 'ended'
    start_at: string | null
    end_at: string | null
    weight: number
  }>
) {
  const db = getDb()
  const [row] = await db
    .update(adCampaigns)
    .set({
      ...(data.slot_id !== undefined ? { slotId: data.slot_id } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.start_at !== undefined ? { startAt: data.start_at ? new Date(data.start_at) : null } : {}),
      ...(data.end_at !== undefined ? { endAt: data.end_at ? new Date(data.end_at) : null } : {}),
      ...(data.weight !== undefined ? { weight: data.weight } : {}),
      updatedAt: new Date(),
    })
    .where(eq(adCampaigns.id, id))
    .returning()
  return row ?? null
}

export async function deleteAdCampaign(id: string) {
  const db = getDb()
  const r = await db.delete(adCampaigns).where(eq(adCampaigns.id, id)).returning({ id: adCampaigns.id })
  return r.length > 0
}

export async function upsertCreative(
  campaignId: string,
  data: {
    id?: string
    headline: string
    body: string | null
    image_url: string | null
    link_url: string
    sort_order: number
    format?: 'image' | 'native' | 'video'
    cta_label?: string | null
    video_url?: string | null
    alt?: string | null
    weight?: number
    is_active?: boolean
  },
) {
  const db = getDb()
  const now = new Date()
  if (data.id) {
    const [row] = await db
      .update(adCreatives)
      .set({
        headline: data.headline,
        body: data.body,
        imageUrl: data.image_url,
        linkUrl: data.link_url,
        sortOrder: data.sort_order,
        updatedAt: now,
        ...(data.format !== undefined ? { creativeFormat: data.format } : {}),
        ...(data.cta_label !== undefined ? { ctaLabel: data.cta_label } : {}),
        ...(data.video_url !== undefined ? { videoUrl: data.video_url } : {}),
        ...(data.alt !== undefined ? { alt: data.alt } : {}),
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        ...(data.is_active !== undefined ? { isActive: data.is_active } : {}),
      })
      .where(and(eq(adCreatives.id, data.id), eq(adCreatives.campaignId, campaignId)))
      .returning()
    return row ?? null
  }
  const [row] = await db
    .insert(adCreatives)
    .values({
      campaignId,
      headline: data.headline,
      body: data.body,
      imageUrl: data.image_url,
      linkUrl: data.link_url,
      sortOrder: data.sort_order,
      creativeFormat: data.format ?? 'native',
      ctaLabel: data.cta_label ?? null,
      videoUrl: data.video_url ?? null,
      alt: data.alt ?? null,
      weight: data.weight ?? 1,
      isActive: data.is_active ?? true,
      updatedAt: now,
    })
    .returning()
  return row
}

export async function deleteCreative(campaignId: string, creativeId: string) {
  const db = getDb()
  const r = await db
    .delete(adCreatives)
    .where(and(eq(adCreatives.id, creativeId), eq(adCreatives.campaignId, campaignId)))
    .returning({ id: adCreatives.id })
  return r.length > 0
}

/* ---------- Homepage sections ---------- */

export async function listHomepageSections() {
  const db = getDb()
  return db.select().from(homepageSections).orderBy(asc(homepageSections.sortOrder))
}

/** Visible sections for public site (cached). */
export async function listPublicHomepageSections() {
  const db = getDb()
  return db
    .select()
    .from(homepageSections)
    .where(eq(homepageSections.isVisible, true))
    .orderBy(asc(homepageSections.sortOrder))
}

export async function updateHomepageSection(
  id: string,
  data: Partial<{
    title: string
    layout: 'featured_grid' | 'list' | 'carousel'
    sort_order: number
    config: Record<string, unknown>
    is_visible: boolean
  }>
) {
  const db = getDb()
  const [row] = await db
    .update(homepageSections)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.layout !== undefined ? { layout: data.layout } : {}),
      ...(data.sort_order !== undefined ? { sortOrder: data.sort_order } : {}),
      ...(data.config !== undefined ? { config: data.config } : {}),
      ...(data.is_visible !== undefined ? { isVisible: data.is_visible } : {}),
      updatedAt: new Date(),
    })
    .where(eq(homepageSections.id, id))
    .returning()
  return row ?? null
}

/* ---------- Subscribers ---------- */

export async function listSubscribers(params: {
  status?: 'pending' | 'confirmed' | 'unsubscribed'
  tag?: string
  source?: string
  q?: string
  page: number
  limit: number
}) {
  const db = getDb()
  const page = Math.max(1, params.page)
  const limit = Math.min(Math.max(1, params.limit), 100)
  const offset = (page - 1) * limit

  const conditions = []
  if (params.status) conditions.push(eq(newsletterSubscribers.status, params.status))
  if (params.tag) {
    const tag = params.tag
    conditions.push(sql`${newsletterSubscribers.segmentTags} @> ARRAY[${tag}]::text[]`)
  }
  if (params.source) conditions.push(eq(newsletterSubscribers.signupSource, params.source))
  if (params.q) {
    const term = `%${params.q}%`
    conditions.push(ilike(newsletterSubscribers.email, term))
  }

  const whereClause = conditions.length ? and(...conditions) : undefined

  const listBase = db.select().from(newsletterSubscribers)
  const countBase = db.select({ c: count() }).from(newsletterSubscribers)

  const [rows, totalRow] = await Promise.all([
    (whereClause ? listBase.where(whereClause) : listBase)
      .orderBy(desc(newsletterSubscribers.subscribedAt))
      .limit(limit)
      .offset(offset),
    whereClause ? countBase.where(whereClause) : countBase,
  ])

  return { data: rows, total: totalRow[0]?.c ?? 0 }
}

export async function updateSubscriberSegments(id: string, segment_tags: string[]) {
  const db = getDb()
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ segmentTags: segment_tags })
    .where(eq(newsletterSubscribers.id, id))
    .returning()
  return row ?? null
}

/* ---------- Newsletter campaigns ---------- */

export async function listNewsletterCampaigns() {
  const db = getDb()
  return db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.updatedAt))
}

export async function getNewsletterCampaignById(id: string) {
  const db = getDb()
  const [row] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id)).limit(1)
  return row ?? null
}

export async function createNewsletterCampaign(data: {
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  segment_filter: Record<string, unknown>
  subject: string
  body_html?: string | null
  preheader?: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduled_at: string | null
  userId: string
}) {
  const db = getDb()
  const [row] = await db
    .insert(newsletterCampaigns)
    .values({
      name: data.name,
      cadence: data.frequency,
      segmentFilter: data.segment_filter,
      subjectTemplate: data.subject,
      bodyHtml: data.body_html ?? null,
      preheader: data.preheader ?? null,
      status: data.status,
      sendAt: data.scheduled_at ? new Date(data.scheduled_at) : null,
      lastSentAt: null,
      createdBy: data.userId,
    })
    .returning()
  return row
}

export async function updateNewsletterCampaign(
  id: string,
  data: Partial<{
    name: string
    frequency: 'daily' | 'weekly' | 'monthly'
    segment_filter: Record<string, unknown>
    subject: string
    body_html: string | null
    preheader: string | null
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
    scheduled_at: string | null
    sent_at: string | null
  }>
) {
  const db = getDb()
  const [row] = await db
    .update(newsletterCampaigns)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.frequency !== undefined ? { cadence: data.frequency } : {}),
      ...(data.segment_filter !== undefined ? { segmentFilter: data.segment_filter } : {}),
      ...(data.subject !== undefined ? { subjectTemplate: data.subject } : {}),
      ...(data.body_html !== undefined ? { bodyHtml: data.body_html } : {}),
      ...(data.preheader !== undefined ? { preheader: data.preheader } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.scheduled_at !== undefined
        ? { sendAt: data.scheduled_at ? new Date(data.scheduled_at) : null }
        : {}),
      ...(data.sent_at !== undefined
        ? { lastSentAt: data.sent_at ? new Date(data.sent_at) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, id))
    .returning()
  return row ?? null
}

export async function deleteNewsletterCampaign(id: string) {
  const db = getDb()
  const r = await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id)).returning({ id: newsletterCampaigns.id })
  return r.length > 0
}

/** Map DB rows to API snake_case */
export function rowAnnouncement(a: typeof readerAnnouncements.$inferSelect) {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    link_url: a.linkUrl ?? null,
    placement: a.placement,
    priority: a.priority,
    starts_at: a.startsAt?.toISOString() ?? null,
    ends_at: a.endsAt?.toISOString() ?? null,
    is_active: a.isActive,
    created_by: a.createdBy,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  }
}

export function rowAdSlot(s: typeof adSlots.$inferSelect) {
  return {
    id: s.id,
    key: s.key,
    label: s.label,
    description: s.description,
    created_at: s.createdAt.toISOString(),
  }
}

export function rowCampaign(
  c: typeof adCampaigns.$inferSelect & { creatives?: (typeof adCreatives.$inferSelect)[] }
) {
  const creatives = (c.creatives ?? []).map((cr) => ({
    id: cr.id,
    campaign_id: cr.campaignId,
    headline: cr.headline,
    body: cr.body,
    image_url: cr.imageUrl,
    link_url: cr.linkUrl,
    sort_order: cr.sortOrder,
    format: cr.creativeFormat,
    cta_label: cr.ctaLabel ?? null,
    video_url: cr.videoUrl ?? null,
    alt: cr.alt ?? null,
    weight: cr.weight,
    is_active: cr.isActive,
    created_at: cr.createdAt.toISOString(),
    updated_at: cr.updatedAt.toISOString(),
  }))
  const { creatives: _, ...rest } = c
  return {
    id: rest.id,
    slot_id: rest.slotId,
    name: rest.name,
    status: rest.status,
    start_at: rest.startAt?.toISOString() ?? null,
    end_at: rest.endAt?.toISOString() ?? null,
    weight: rest.weight,
    created_by: rest.createdBy,
    created_at: rest.createdAt.toISOString(),
    updated_at: rest.updatedAt.toISOString(),
    creatives,
  }
}

export function rowHomepageSection(h: typeof homepageSections.$inferSelect) {
  return {
    id: h.id,
    key: h.key,
    title: h.title,
    layout: h.layout,
    sort_order: h.sortOrder,
    config: h.config as Record<string, unknown>,
    is_visible: h.isVisible,
    updated_at: h.updatedAt.toISOString(),
  }
}

export function rowSubscriber(s: typeof newsletterSubscribers.$inferSelect) {
  return {
    id: s.id,
    email: s.email,
    status: s.status,
    segment_tags: s.segmentTags ?? [],
    signup_source: s.signupSource,
    confirmed_at: s.confirmedAt?.toISOString() ?? null,
    subscribed_at: s.subscribedAt.toISOString(),
  }
}

export function rowNewsletterCampaign(n: typeof newsletterCampaigns.$inferSelect) {
  return {
    id: n.id,
    name: n.name,
    cadence: n.cadence,
    segment_filter: n.segmentFilter as Record<string, unknown>,
    subject_template: n.subjectTemplate,
    body_html: n.bodyHtml ?? null,
    preheader: n.preheader ?? null,
    status: n.status,
    send_at: n.sendAt?.toISOString() ?? null,
    last_sent_at: n.lastSentAt?.toISOString() ?? null,
    created_by: n.createdBy,
    created_at: n.createdAt.toISOString(),
    updated_at: n.updatedAt.toISOString(),
  }
}

