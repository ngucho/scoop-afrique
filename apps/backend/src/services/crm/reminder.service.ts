/**
 * CRM reminder service
 */
import { eq, and, desc, sql, isNull, isNotNull } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmReminders } from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateReminderInput } from '../../schemas/crm/reminder.schema.js'

export async function listReminders(params?: {
  contactId?: string
  invoiceId?: string
  status?: 'pending' | 'sent'
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const db = getDb()
  const conditions = []
  if (params?.contactId) conditions.push(eq(crmReminders.contactId, params.contactId))
  if (params?.invoiceId) conditions.push(eq(crmReminders.invoiceId, params.invoiceId))
  if (params?.status === 'pending') {
    conditions.push(isNull(crmReminders.sentAt))
    conditions.push(isNotNull(crmReminders.scheduledAt))
  } else if (params?.status === 'sent') {
    conditions.push(isNotNull(crmReminders.sentAt))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(crmReminders)
      .where(whereClause)
      .orderBy(desc(crmReminders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmReminders)
      .where(whereClause),
  ])

  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
  }
}

export async function getReminderById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmReminders).where(eq(crmReminders.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function createReminder(
  input: CreateReminderInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const [reminder] = await db
    .insert(crmReminders)
    .values({
      contactId: input.contact_id,
      invoiceId: input.invoice_id || null,
      projectId: input.project_id || null,
      type: input.type.trim(),
      channel: (input.channel ?? 'both') as typeof crmReminders.channel.enumValues[number],
      message: input.message.trim(),
      scheduledAt: input.scheduled_at ? new Date(input.scheduled_at) : null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!reminder) throw new Error('Failed to create reminder')
  return toSnakeRecord(reminder as Record<string, unknown>)
}

export async function markReminderSent(id: string): Promise<Record<string, unknown>> {
  const db = getDb()
  const [reminder] = await db
    .update(crmReminders)
    .set({ sentAt: new Date() })
    .where(eq(crmReminders.id, id))
    .returning()
  if (!reminder) throw new Error('Failed to update reminder')
  return toSnakeRecord(reminder as Record<string, unknown>)
}
