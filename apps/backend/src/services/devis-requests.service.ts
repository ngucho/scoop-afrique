/**
 * Devis requests (from brands form) — list and update for CRM
 */
import { desc, eq, count } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { devisRequests } from '../db/schema.js'
import { config } from '../config/env.js'

function toRecord(row: typeof devisRequests.$inferSelect): Record<string, unknown> {
  return {
    id: row.id,
    first_name: row.firstName,
    last_name: row.lastName,
    email: row.email,
    phone: row.phone,
    company: row.company,
    service_slug: row.serviceSlug,
    budget_min: row.budgetMin,
    budget_max: row.budgetMax,
    budget_currency: row.budgetCurrency,
    preferred_date: row.preferredDate,
    deadline: row.deadline,
    description: row.description,
    source_url: row.sourceUrl,
    converted_to_contact_id: row.convertedToContactId,
    converted_to_devis_id: row.convertedToDevisId,
    archived: row.archived,
    created_at: row.createdAt?.toISOString(),
  }
}

export async function listDevisRequests(params?: {
  limit?: number
  offset?: number
  treated?: boolean
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const [countRow] = await db.select({ count: count() }).from(devisRequests)
  const total = countRow?.count ?? 0

  const rows = await db
    .select()
    .from(devisRequests)
    .orderBy(desc(devisRequests.createdAt))
    .limit(limit)
    .offset(offset)

  return { data: rows.map(toRecord), total }
}

export async function getDevisRequestById(id: string): Promise<Record<string, unknown> | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db.select().from(devisRequests).where(eq(devisRequests.id, id)).limit(1)
  return row ? toRecord(row) : null
}

export async function updateDevisRequestConversion(
  id: string,
  payload: { converted_to_contact_id?: string; converted_to_devis_id?: string; archived?: boolean }
): Promise<Record<string, unknown> | null> {
  if (!config.database) return null
  const updates: Partial<typeof devisRequests.$inferInsert> = {}
  if (payload.converted_to_contact_id !== undefined) {
    updates.convertedToContactId = payload.converted_to_contact_id || null
  }
  if (payload.converted_to_devis_id !== undefined) {
    updates.convertedToDevisId = payload.converted_to_devis_id || null
  }
  if (payload.archived !== undefined) {
    updates.archived = payload.archived
  }
  if (Object.keys(updates).length === 0) return getDevisRequestById(id)

  const db = getDb()
  const [row] = await db
    .update(devisRequests)
    .set(updates)
    .where(eq(devisRequests.id, id))
    .returning()
  return row ? toRecord(row) : null
}

export async function deleteDevisRequest(id: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db.delete(devisRequests).where(eq(devisRequests.id, id)).returning({ id: devisRequests.id })
  return !!row
}
