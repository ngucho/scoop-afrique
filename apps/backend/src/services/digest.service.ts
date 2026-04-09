import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { digestJobs, newsletterCampaigns } from '../db/schema.js'
import { config } from '../config/env.js'
import type { CreateNewsletterCampaignBody, UpdateNewsletterCampaignBody } from '../schemas/digest.js'
import type { DigestFrequency } from '../schemas/subscribers.js'

function campaignToApi(row: typeof newsletterCampaigns.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    segment_id: row.segmentId,
    frequency: row.frequency,
    status: row.status,
    scheduled_at: row.scheduledAt?.toISOString() ?? null,
    sent_at: row.sentAt?.toISOString() ?? null,
    subject: row.subject,
    template_key: row.templateKey,
    stats: row.stats as Record<string, unknown>,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function jobToApi(row: typeof digestJobs.$inferSelect) {
  return {
    id: row.id,
    campaign_id: row.campaignId,
    frequency: row.frequency,
    status: row.status,
    scheduled_for: row.scheduledFor.toISOString(),
    started_at: row.startedAt?.toISOString() ?? null,
    completed_at: row.completedAt?.toISOString() ?? null,
    result: row.result as Record<string, unknown> | null,
    error: row.error,
    created_at: row.createdAt.toISOString(),
  }
}

export async function listNewsletterCampaigns() {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt))
  return rows.map(campaignToApi)
}

export async function createNewsletterCampaign(body: CreateNewsletterCampaignBody) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const [row] = await db
    .insert(newsletterCampaigns)
    .values({
      name: body.name,
      segmentId: body.segment_id ?? null,
      frequency: body.frequency ?? 'weekly',
      status: body.status ?? 'draft',
      scheduledAt: body.scheduled_at ? new Date(body.scheduled_at) : null,
      subject: body.subject ?? null,
      templateKey: body.template_key ?? null,
      stats: body.stats ?? {},
    })
    .returning()
  return campaignToApi(row!)
}

export async function updateNewsletterCampaign(id: string, body: UpdateNewsletterCampaignBody) {
  if (!config.database) return null
  const db = getDb()
  const patch: {
    updatedAt: Date
    name?: string
    segmentId?: string | null
    frequency?: DigestFrequency
    status?: (typeof newsletterCampaigns.$inferSelect)['status']
    scheduledAt?: Date | null
    subject?: string | null
    templateKey?: string | null
    stats?: Record<string, unknown>
  } = { updatedAt: new Date() }
  if (body.name !== undefined) patch.name = body.name
  if (body.segment_id !== undefined) patch.segmentId = body.segment_id
  if (body.frequency !== undefined) patch.frequency = body.frequency
  if (body.status !== undefined) patch.status = body.status
  if (body.scheduled_at !== undefined) patch.scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : null
  if (body.subject !== undefined) patch.subject = body.subject
  if (body.template_key !== undefined) patch.templateKey = body.template_key
  if (body.stats !== undefined) patch.stats = body.stats
  const [row] = await db.update(newsletterCampaigns).set(patch).where(eq(newsletterCampaigns.id, id)).returning()
  return row ? campaignToApi(row) : null
}

export async function deleteNewsletterCampaign(id: string) {
  if (!config.database) return false
  const db = getDb()
  const res = await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id)).returning({ id: newsletterCampaigns.id })
  return res.length > 0
}

export interface EnqueueDigestInput {
  frequency: DigestFrequency
  campaign_id?: string
  scheduled_for?: Date
  send_now?: boolean
}

/**
 * Enqueue a digest job. When send_now is true, marks job as sent with a placeholder result (email dispatch is TODO).
 */
export async function enqueueDigestJob(input: EnqueueDigestInput) {
  if (!config.database) throw new Error('Database not configured (DATABASE_URL)')
  const db = getDb()
  const scheduledFor = input.scheduled_for ?? new Date()
  const sendNow = input.send_now === true

  const [row] = await db
    .insert(digestJobs)
    .values({
      campaignId: input.campaign_id ?? null,
      frequency: input.frequency,
      status: sendNow ? 'sent' : 'pending',
      scheduledFor,
      startedAt: sendNow ? new Date() : null,
      completedAt: sendNow ? new Date() : null,
      result: sendNow
        ? { mode: 'immediate', note: 'Digest pipeline not wired; mark as sent for API contract.' }
        : null,
    })
    .returning()

  return jobToApi(row!)
}

export async function listDigestJobs(limit = 50) {
  if (!config.database) return []
  const db = getDb()
  const rows = await db.select().from(digestJobs).orderBy(desc(digestJobs.createdAt)).limit(Math.min(limit, 200))
  return rows.map(jobToApi)
}
