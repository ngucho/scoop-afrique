/**
 * Reader platform admin API — announcements, ads, homepage, subscribers, newsletter campaigns, KPIs.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { config } from '../../config/env.js'
import * as reader from '../../services/reader-platform.service.js'
import * as chromeSettings from '../../services/chrome-settings.service.js'
import * as audienceMetrics from '../../services/audience-metric.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth)

function requireDatabase(c: import('hono').Context) {
  if (!config.database) {
    return c.json(
      {
        error: 'Database not configured',
        code: 'CONFIG',
        hint: 'Set DATABASE_URL in the backend .env',
      },
      503,
    )
  }
  return null
}

const announcementBody = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
  audience: z.enum(['all', 'subscribers', 'guests']),
  link_url: z.string().url().nullable().optional().or(z.literal('').transform(() => null)),
  placement: z.enum(['banner', 'modal', 'inline', 'footer', 'sidebar']).optional(),
  priority: z.number().int().min(0).max(999).optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean(),
})

const chromeSettingsBody = z.object({
  empty_ad_title: z.string().max(500).nullable().optional(),
  empty_ad_subtitle: z.string().max(2000).nullable().optional(),
})

const optionalIsoDatetime = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null || String(v).trim() === '') return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  })

const campaignBodyShape = {
  slot_id: z.string().uuid(),
  name: z.string().min(1).max(300),
  status: z.enum(['draft', 'active', 'paused', 'ended']),
  start_at: optionalIsoDatetime,
  end_at: optionalIsoDatetime,
  weight: z.number().int().min(0).max(100).optional(),
}

const campaignBody = z
  .object(campaignBodyShape)
  .refine(
    (d) => {
      if (!d.start_at || !d.end_at) return true
      return new Date(d.end_at).getTime() >= new Date(d.start_at).getTime()
    },
    { message: 'end_before_start', path: ['end_at'] },
  )

const campaignPatchBody = z.object(campaignBodyShape).partial()

const creativeBody = z.object({
  id: z.string().uuid().optional(),
  headline: z.string().min(1).max(500),
  body: z.string().max(5000).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  link_url: z.string().url(),
  sort_order: z.number().int().min(0).optional(),
  format: z.enum(['image', 'native', 'video']).optional(),
  cta_label: z.string().max(120).nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  alt: z.string().max(500).nullable().optional(),
  weight: z.number().int().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
})

const homepagePatch = z.object({
  title: z.string().min(1).max(200).optional(),
  layout: z.enum(['featured_grid', 'list', 'carousel']).optional(),
  sort_order: z.number().int().optional(),
  config: z.record(z.unknown()).optional(),
  is_visible: z.boolean().optional(),
})

const segmentPatch = z.object({
  segment_tags: z.array(z.string().max(64)).max(32),
  reason: z.string().max(500).optional(),
})

const nlCampaignBody = z.object({
  name: z.string().min(1).max(300),
  cadence: z.enum(['daily', 'weekly', 'monthly']),
  segment_filter: z.record(z.unknown()).optional(),
  subject_template: z.string().min(1).max(500),
  body_html: z.string().max(500000).nullable().optional(),
  preheader: z.string().max(300).nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']).default('draft'),
  send_at: z.string().datetime().nullable().optional(),
})

const nlCampaignPatch = nlCampaignBody.partial().extend({
  last_sent_at: z.string().datetime().nullable().optional(),
})

/* --- KPIs (editor+): used by dashboard --- */
app.get('/kpis', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const data = await reader.getReaderDashboardKpis()
  return c.json({ data })
})

const audienceMetricIngestBody = z.object({
  platform: z.string().min(1).max(64),
  metric_key: z.string().min(1).max(128),
  snapshot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country_code: z.string().max(8).optional().nullable(),
  value_numeric: z.union([z.string(), z.number()]),
  source: z.string().max(32).optional(),
  metadata: z.record(z.unknown()).optional(),
})

/* --- Audience / social / site metrics (editor+ read/write, audited on POST) --- */
app.get('/audience-metrics', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const platform = c.req.query('platform') ?? undefined
  const days = Math.min(Number(c.req.query('days')) || 90, 730)
  const limit = Math.min(Number(c.req.query('limit')) || 500, 2000)
  const data = await audienceMetrics.listAudienceMetricsRecent({ platform, days, limit })
  return c.json({ data })
})

app.get('/audience-metrics/latest', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const data = await audienceMetrics.getLatestAudienceMetricsByKey()
  return c.json({ data })
})

app.post('/audience-metrics', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const parsed = audienceMetricIngestBody.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await audienceMetrics.insertAudienceMetricSnapshot(parsed.data)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'audience_metric_snapshot',
    entityId: row.id,
    action: 'ingest',
    metadata: { platform: row.platform, metric_key: row.metric_key },
  })
  return c.json({ data: row }, 201)
})

app.get('/reports/audience', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const metricKey = c.req.query('metric_key') ?? 'followers'
  const platform = c.req.query('platform') ?? undefined
  const snapshotDate = c.req.query('snapshot_date') ?? undefined
  const latest = await audienceMetrics.getLatestAudienceMetricsByKey()
  const byCountry = await audienceMetrics.getCountryLeaderboard({
    metric_key: metricKey,
    platform,
    snapshot_date: snapshotDate ?? undefined,
  })
  return c.json({
    data: {
      latest,
      country_leaderboard: byCountry,
      generated_at: new Date().toISOString(),
    },
  })
})

/* --- Announcements (editor+ read/write) --- */
app.get('/announcements', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const rows = await reader.listAnnouncements()
  return c.json({ data: rows.map(reader.rowAnnouncement) })
})

app.post('/announcements', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const parsed = announcementBody.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await reader.createAnnouncement(
    {
      ...parsed.data,
      link_url: parsed.data.link_url ?? null,
      placement: parsed.data.placement,
      priority: parsed.data.priority,
      starts_at: parsed.data.starts_at ?? null,
      ends_at: parsed.data.ends_at ?? null,
    },
    user.id,
  )
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'reader_announcement',
    entityId: row.id,
    action: 'create',
    metadata: { title: row.title },
  })
  return c.json({ data: reader.rowAnnouncement(row) }, 201)
})

app.patch('/announcements/:id', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const parsed = announcementBody.partial().safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await reader.updateAnnouncement(id, {
    ...parsed.data,
    starts_at: parsed.data.starts_at ?? undefined,
    ends_at: parsed.data.ends_at ?? undefined,
  })
  if (!row) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'reader_announcement',
    entityId: id,
    action: 'update',
    metadata: parsed.data,
  })
  return c.json({ data: reader.rowAnnouncement(row) })
})

app.delete('/announcements/:id', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const ok = await reader.deleteAnnouncement(id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'reader_announcement',
    entityId: id,
    action: 'delete',
  })
  return c.body(null, 204)
})

/* --- Ads (manager+) --- */
app.get('/ads/slots', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const rows = await reader.listAdSlots()
  return c.json({ data: rows.map(reader.rowAdSlot) })
})

app.get('/ads/campaigns', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const rows = await reader.listAdCampaignsWithCreatives()
  return c.json({ data: rows.map(reader.rowCampaign) })
})

app.get('/ads/metrics', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const days = Math.min(366, Math.max(1, Number(c.req.query('days')) || 30))
  const data = await reader.getReaderAdMetrics(days)
  return c.json({ data })
})

app.post('/ads/campaigns', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const parsed = campaignBody.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const endOrder = parsed.error.issues.find((i) => i.path.includes('end_at'))?.message === 'end_before_start'
    const msg = endOrder
      ? 'La date de fin doit être postérieure ou égale à la date de début.'
      : parsed.error.issues[0]?.message ?? 'Invalid body'
    return c.json({ error: msg, code: 'VALIDATION_ERROR', details: flat }, 400)
  }
  const row = await reader.createAdCampaign({
    ...parsed.data,
    start_at: parsed.data.start_at ?? null,
    end_at: parsed.data.end_at ?? null,
    weight: parsed.data.weight ?? 1,
    userId: user.id,
  })
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'ad_campaign',
    entityId: row.id,
    action: 'create',
    metadata: { name: row.name, slot_id: row.slotId },
  })
  return c.json({ data: reader.rowCampaign({ ...row, creatives: [] }) }, 201)
})

app.patch('/ads/campaigns/:id', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const parsed = campaignPatchBody.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body'
    return c.json({ error: msg, code: 'VALIDATION_ERROR', details: flat }, 400)
  }
  const existing = await reader.getAdCampaignById(id)
  if (!existing) return c.json({ error: 'Not found' }, 404)
  const mergedStart =
    parsed.data.start_at !== undefined ? parsed.data.start_at : existing.startAt ? existing.startAt.toISOString() : null
  const mergedEnd =
    parsed.data.end_at !== undefined ? parsed.data.end_at : existing.endAt ? existing.endAt.toISOString() : null
  if (mergedStart && mergedEnd && new Date(mergedEnd).getTime() < new Date(mergedStart).getTime()) {
    return c.json(
      { error: 'La date de fin doit être postérieure ou égale à la date de début.', code: 'INVALID_RANGE' },
      400,
    )
  }
  const row = await reader.updateAdCampaign(id, {
    ...parsed.data,
    start_at: parsed.data.start_at,
    end_at: parsed.data.end_at,
  })
  if (!row) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'ad_campaign',
    entityId: id,
    action: 'update',
    metadata: parsed.data,
  })
  const full = await reader.listAdCampaignsWithCreatives()
  const one = full.find((x) => x.id === id)
  return c.json({ data: one ? reader.rowCampaign(one) : reader.rowCampaign({ ...row, creatives: [] }) })
})

app.delete('/ads/campaigns/:id', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const ok = await reader.deleteAdCampaign(id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({ actorId: user.id, entityType: 'ad_campaign', entityId: id, action: 'delete' })
  return c.body(null, 204)
})

app.post('/ads/campaigns/:id/creatives', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const campaignId = c.req.param('id')
  const parsed = creativeBody.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await reader.upsertCreative(campaignId, {
    id: parsed.data.id,
    headline: parsed.data.headline,
    body: parsed.data.body ?? null,
    image_url: parsed.data.image_url ?? null,
    link_url: parsed.data.link_url,
    sort_order: parsed.data.sort_order ?? 0,
    format: parsed.data.format,
    cta_label: parsed.data.cta_label,
    video_url: parsed.data.video_url,
    alt: parsed.data.alt,
    weight: parsed.data.weight,
    is_active: parsed.data.is_active,
  })
  if (!row) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'ad_creative',
    entityId: row.id,
    action: parsed.data.id ? 'update' : 'create',
    metadata: { campaign_id: campaignId },
  })
  return c.json({
    data: {
      id: row.id,
      campaign_id: row.campaignId,
      headline: row.headline,
      body: row.body,
      image_url: row.imageUrl,
      link_url: row.linkUrl,
      sort_order: row.sortOrder,
      format: row.creativeFormat,
      cta_label: row.ctaLabel ?? null,
      video_url: row.videoUrl ?? null,
      alt: row.alt ?? null,
      weight: row.weight,
      is_active: row.isActive,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    },
  })
})

app.delete('/ads/campaigns/:campaignId/creatives/:creativeId', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const { campaignId, creativeId } = c.req.param()
  const ok = await reader.deleteCreative(campaignId, creativeId)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'ad_creative',
    entityId: creativeId,
    action: 'delete',
    metadata: { campaign_id: campaignId },
  })
  return c.body(null, 204)
})

/* --- Homepage (manager+) --- */
app.get('/homepage-sections', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const rows = await reader.listHomepageSections()
  return c.json({ data: rows.map(reader.rowHomepageSection) })
})

app.patch('/homepage-sections/:id', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const parsed = homepagePatch.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await reader.updateHomepageSection(id, parsed.data)
  if (!row) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'homepage_section',
    entityId: id,
    action: 'update',
    metadata: parsed.data,
  })
  return c.json({ data: reader.rowHomepageSection(row) })
})

/* --- Subscribers (manager+) --- */
app.get('/subscribers', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const status = c.req.query('status') as 'pending' | 'confirmed' | 'unsubscribed' | undefined
  const tag = c.req.query('tag') ?? undefined
  const source = c.req.query('source') ?? undefined
  const q = c.req.query('q') ?? undefined
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const { data, total } = await reader.listSubscribers({
    status,
    tag,
    source,
    q,
    page,
    limit,
  })
  return c.json({ data: data.map(reader.rowSubscriber), total })
})

app.patch('/subscribers/:id', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const parsed = segmentPatch.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await reader.updateSubscriberSegments(id, parsed.data.segment_tags)
  if (!row) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'newsletter_subscriber',
    entityId: id,
    action: 'segment_update',
    reason: parsed.data.reason,
    metadata: { segment_tags: parsed.data.segment_tags },
  })
  return c.json({ data: reader.rowSubscriber(row) })
})

/* --- Newsletter campaigns (manager+) --- */
app.get('/newsletter-campaigns/:id', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const id = c.req.param('id')
  const row = await reader.getNewsletterCampaignById(id)
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: reader.rowNewsletterCampaign(row) })
})

app.get('/newsletter-campaigns', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const rows = await reader.listNewsletterCampaigns()
  return c.json({ data: rows.map(reader.rowNewsletterCampaign) })
})

app.post('/newsletter-campaigns', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const parsed = nlCampaignBody.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await reader.createNewsletterCampaign({
    name: parsed.data.name,
    frequency: parsed.data.cadence,
    segment_filter: parsed.data.segment_filter ?? {},
    subject: parsed.data.subject_template,
    body_html: parsed.data.body_html ?? null,
    preheader: parsed.data.preheader ?? null,
    status: parsed.data.status,
    scheduled_at: parsed.data.send_at ?? null,
    userId: user.id,
  })
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'newsletter_campaign',
    entityId: row.id,
    action: 'create',
    metadata: { name: row.name, cadence: row.cadence },
  })
  return c.json({ data: reader.rowNewsletterCampaign(row) }, 201)
})

app.patch('/newsletter-campaigns/:id', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const parsed = nlCampaignPatch.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await reader.updateNewsletterCampaign(id, {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.cadence !== undefined ? { frequency: parsed.data.cadence } : {}),
    ...(parsed.data.subject_template !== undefined ? { subject: parsed.data.subject_template } : {}),
    ...(parsed.data.body_html !== undefined ? { body_html: parsed.data.body_html } : {}),
    ...(parsed.data.preheader !== undefined ? { preheader: parsed.data.preheader } : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    segment_filter: parsed.data.segment_filter,
    scheduled_at: parsed.data.send_at,
    sent_at: parsed.data.last_sent_at,
  })
  if (!row) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'newsletter_campaign',
    entityId: id,
    action: 'update',
    metadata: parsed.data,
  })
  return c.json({ data: reader.rowNewsletterCampaign(row) })
})

app.delete('/newsletter-campaigns/:id', requireRole('manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const ok = await reader.deleteNewsletterCampaign(id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'newsletter_campaign',
    entityId: id,
    action: 'delete',
  })
  return c.body(null, 204)
})

/* --- Textes emplacements pub vides (message Scoop) --- */
app.get('/chrome-settings', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const data = await chromeSettings.getChromeSettingsAdmin()
  return c.json({ data })
})

app.patch('/chrome-settings', requireRole('editor', 'manager', 'admin'), async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const parsed = chromeSettingsBody.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await chromeSettings.upsertChromeSettings(parsed.data)
  await reader.appendAudit({
    actorId: user.id,
    entityType: 'reader_chrome_settings',
    entityId: 'default',
    action: 'update',
    metadata: parsed.data as Record<string, unknown>,
  })
  return c.json({ data: row })
})

export default app
