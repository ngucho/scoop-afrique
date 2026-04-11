/**
 * CRM services catalog — prestations (description, prix, unité)
 */
import { eq, and, asc, sql, ilike, or } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmServices } from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateServiceInput, UpdateServiceInput } from '../../schemas/crm/service.schema.js'

export async function listServices(params?: {
  active?: boolean
  category?: string
  limit?: number
  offset?: number
  search?: string
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const db = getDb()
  const conditions = []
  if (params?.active !== undefined) conditions.push(eq(crmServices.isActive, params.active))
  if (params?.category) conditions.push(eq(crmServices.category, params.category))
  const q = params?.search?.trim()
  if (q) {
    const pat = `%${q}%`
    conditions.push(
      or(
        ilike(crmServices.name, pat),
        ilike(crmServices.slug, pat),
        ilike(crmServices.description, pat),
        ilike(crmServices.category, pat)
      )!
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(crmServices)
      .where(whereClause)
      .orderBy(asc(crmServices.sortOrder), asc(crmServices.name))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmServices)
      .where(whereClause),
  ])

  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
  }
}

export async function getServiceById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmServices).where(eq(crmServices.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function getServiceBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmServices).where(eq(crmServices.slug, slug)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function createService(input: CreateServiceInput): Promise<Record<string, unknown>> {
  const db = getDb()
  const [svc] = await db
    .insert(crmServices)
    .values({
      slug: input.slug.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      unit: input.unit?.trim() || 'unité',
      defaultPrice: input.default_price ?? 0,
      currency: input.currency ?? 'FCFA',
      category: input.category?.trim() || null,
      isActive: input.is_active ?? true,
      sortOrder: input.sort_order ?? 0,
    })
    .returning()

  if (!svc) throw new Error('Failed to create service')
  return toSnakeRecord(svc as Record<string, unknown>)
}

export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<Record<string, unknown>> {
  const db = getDb()
  const update: Partial<typeof crmServices.$inferInsert> = {}
  if (input.slug !== undefined) update.slug = input.slug.trim()
  if (input.name !== undefined) update.name = input.name.trim()
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.unit !== undefined) update.unit = input.unit.trim()
  if (input.default_price !== undefined) update.defaultPrice = input.default_price
  if (input.currency !== undefined) update.currency = input.currency
  if (input.category !== undefined) update.category = input.category?.trim() || null
  if (input.is_active !== undefined) update.isActive = input.is_active
  if (input.sort_order !== undefined) update.sortOrder = input.sort_order

  const [svc] = await db.update(crmServices).set(update).where(eq(crmServices.id, id)).returning()
  if (!svc) throw new Error('Failed to update service')
  return toSnakeRecord(svc as Record<string, unknown>)
}

export async function deleteService(id: string): Promise<void> {
  const db = getDb()
  await db.delete(crmServices).where(eq(crmServices.id, id))
}
