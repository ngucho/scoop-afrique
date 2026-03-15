/**
 * CRM activity log — record actions for audit trail
 */
import { eq, and, desc } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmActivityLog } from '../../db/schema.js'
import { config } from '../../config/env.js'

function toRecord(row: typeof crmActivityLog.$inferSelect): Record<string, unknown> {
  return {
    id: row.id,
    entity_type: row.entityType,
    entity_id: row.entityId,
    action: row.action,
    description: row.description,
    metadata: row.metadata,
    created_by: row.createdBy,
    created_at: row.createdAt?.toISOString(),
  }
}

export async function logActivity(params: {
  entityType: string
  entityId: string
  action: string
  description?: string
  metadata?: Record<string, unknown>
  createdBy?: string
}): Promise<void> {
  if (!config.database) return
  const db = getDb()
  await db.insert(crmActivityLog).values({
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    description: params.description ?? null,
    metadata: params.metadata ?? {},
    createdBy: params.createdBy ?? null,
  })
}

export async function getActivityLog(
  entityType: string,
  entityId: string,
  limit = 50
): Promise<Array<Record<string, unknown>>> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select()
    .from(crmActivityLog)
    .where(and(eq(crmActivityLog.entityType, entityType), eq(crmActivityLog.entityId, entityId)))
    .orderBy(desc(crmActivityLog.createdAt))
    .limit(limit)
  return rows.map(toRecord)
}

export async function getGlobalActivity(limit = 100): Promise<Array<Record<string, unknown>>> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select()
    .from(crmActivityLog)
    .orderBy(desc(crmActivityLog.createdAt))
    .limit(limit)
  return rows.map(toRecord)
}
