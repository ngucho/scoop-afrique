/**
 * CRM deliverable and metrics service
 */
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmDeliverables, crmDeliverableMetrics } from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import type {
  CreateDeliverableInput,
  UpdateDeliverableInput,
  DeliverableMetricsInput,
} from '../../schemas/crm/deliverable.schema.js'

export async function listDeliverablesByProject(
  projectId: string
): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const rows = await db
    .select()
    .from(crmDeliverables)
    .where(eq(crmDeliverables.projectId, projectId))
    .orderBy(desc(crmDeliverables.createdAt))
  return rows.map((r) => toSnakeRecord(r as Record<string, unknown>))
}

export async function getDeliverableById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmDeliverables).where(eq(crmDeliverables.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function createDeliverable(
  projectId: string,
  input: CreateDeliverableInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const [deliverable] = await db
    .insert(crmDeliverables)
    .values({
      projectId,
      title: input.title.trim(),
      type: (input.type ?? 'post') as typeof crmDeliverables.type.enumValues[number],
      platform: (input.platform ?? 'instagram') as typeof crmDeliverables.platform.enumValues[number],
      url: input.url?.trim() || null,
      thumbnailUrl: input.thumbnail_url?.trim() || null,
      publishedAt: input.published_at ? new Date(input.published_at) : null,
      notes: input.notes?.trim() || null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!deliverable) throw new Error('Failed to create deliverable')
  return toSnakeRecord(deliverable as Record<string, unknown>)
}

export async function updateDeliverable(
  id: string,
  input: UpdateDeliverableInput
): Promise<Record<string, unknown>> {
  const db = getDb()
  const update: Partial<typeof crmDeliverables.$inferInsert> = {}
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.type !== undefined) update.type = input.type as typeof crmDeliverables.type.enumValues[number]
  if (input.platform !== undefined) update.platform = input.platform as typeof crmDeliverables.platform.enumValues[number]
  if (input.url !== undefined) update.url = input.url?.trim() || null
  if (input.thumbnail_url !== undefined) update.thumbnailUrl = input.thumbnail_url?.trim() || null
  if (input.published_at !== undefined) update.publishedAt = input.published_at ? new Date(input.published_at) : null
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null

  const [deliverable] = await db.update(crmDeliverables).set(update).where(eq(crmDeliverables.id, id)).returning()
  if (!deliverable) throw new Error('Failed to update deliverable')
  return toSnakeRecord(deliverable as Record<string, unknown>)
}

export async function addDeliverableMetrics(
  deliverableId: string,
  input: DeliverableMetricsInput
): Promise<Record<string, unknown>> {
  const db = getDb()
  let engagementRate: number | null = null
  if (
    input.views != null &&
    (input.likes != null || input.comments != null || input.shares != null || input.saves != null)
  ) {
    const engagements = (input.likes ?? 0) + (input.comments ?? 0) + (input.shares ?? 0) + (input.saves ?? 0)
    engagementRate = input.views > 0 ? Math.round((engagements / input.views) * 1000) / 1000 : 0
  }

  const [metric] = await db
    .insert(crmDeliverableMetrics)
    .values({
      deliverableId,
      views: input.views ?? null,
      likes: input.likes ?? null,
      comments: input.comments ?? null,
      shares: input.shares ?? null,
      saves: input.saves ?? null,
      reach: input.reach ?? null,
      impressions: input.impressions ?? null,
      clicks: input.clicks ?? null,
      engagementRate: engagementRate ?? input.engagement_rate ?? null,
      extra: input.extra ?? {},
    })
    .returning()

  if (!metric) throw new Error('Failed to add deliverable metrics')
  return toSnakeRecord(metric as Record<string, unknown>)
}

export async function getDeliverableMetrics(
  deliverableId: string,
  limit = 50
): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const rows = await db
    .select()
    .from(crmDeliverableMetrics)
    .where(eq(crmDeliverableMetrics.deliverableId, deliverableId))
    .orderBy(desc(crmDeliverableMetrics.recordedAt))
    .limit(limit)
  return rows.map((r) => toSnakeRecord(r as Record<string, unknown>))
}
