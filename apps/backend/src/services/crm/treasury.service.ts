/**
 * Treasury movements (revenus / dépenses hors facturation CRM)
 */
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmTreasuryMovements } from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateTreasuryMovementInput, UpdateTreasuryMovementInput } from '../../schemas/crm/treasury.schema.js'
import { treasuryExpenseCategories, treasuryIncomeCategories } from '../../schemas/crm/treasury.schema.js'

export async function listTreasuryMovements(params?: {
  direction?: 'income' | 'expense'
  category?: string
  from?: string
  to?: string
  sort?: 'occurred_at' | 'created_at' | 'amount'
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const db = getDb()
  const conditions = []
  if (params?.direction) conditions.push(eq(crmTreasuryMovements.direction, params.direction))
  if (params?.category) conditions.push(eq(crmTreasuryMovements.category, params.category))
  // Cast explicite ::date (colonne SQL `date`) pour éviter les soucis de comparaison selon le driver
  if (params?.from) {
    conditions.push(sql`${crmTreasuryMovements.occurredAt} >= ${params.from}::date`)
  }
  if (params?.to) {
    conditions.push(sql`${crmTreasuryMovements.occurredAt} <= ${params.to}::date`)
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const sortCol =
    params?.sort === 'amount'
      ? crmTreasuryMovements.amount
      : params?.sort === 'created_at'
        ? crmTreasuryMovements.createdAt
        : crmTreasuryMovements.occurredAt
  const orderFn = params?.order === 'asc' ? asc : desc

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(crmTreasuryMovements)
      .where(whereClause)
      .orderBy(orderFn(sortCol), desc(crmTreasuryMovements.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmTreasuryMovements)
      .where(whereClause),
  ])

  return {
    data: rows.map((r) => toSnakeRecord(r as Record<string, unknown>)),
    total: count ?? 0,
  }
}

export async function getTreasuryMovementById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const [row] = await db.select().from(crmTreasuryMovements).where(eq(crmTreasuryMovements.id, id)).limit(1)
  return row ? toSnakeRecord(row as Record<string, unknown>) : null
}

export async function createTreasuryMovement(
  input: CreateTreasuryMovementInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const [row] = await db
    .insert(crmTreasuryMovements)
    .values({
      direction: input.direction,
      category: input.category,
      amount: input.amount,
      currency: input.currency ?? 'FCFA',
      occurredAt: input.occurred_at || new Date().toISOString().slice(0, 10),
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      metadata: input.metadata ?? {},
      projectId: input.project_id || null,
      createdBy: createdBy ?? null,
    })
    .returning()
  if (!row) throw new Error('Failed to create treasury movement')
  return toSnakeRecord(row as Record<string, unknown>)
}

function assertCategoryForDirection(direction: string, category: string) {
  const inc = new Set(treasuryIncomeCategories)
  const exp = new Set(treasuryExpenseCategories)
  if (direction === 'income' && !inc.has(category as (typeof treasuryIncomeCategories)[number])) {
    throw new Error(`Catégorie de revenu invalide: ${category}`)
  }
  if (direction === 'expense' && !exp.has(category as (typeof treasuryExpenseCategories)[number])) {
    throw new Error(`Catégorie de dépense invalide: ${category}`)
  }
}

export async function updateTreasuryMovement(
  id: string,
  input: UpdateTreasuryMovementInput
): Promise<Record<string, unknown>> {
  const db = getDb()
  const existing = await getTreasuryMovementById(id)
  if (!existing) throw new Error('Not found')

  const nextDir = (input.direction ?? existing.direction) as string
  const nextCat = (input.category ?? existing.category) as string
  assertCategoryForDirection(nextDir, nextCat)

  const update: Partial<typeof crmTreasuryMovements.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (input.direction !== undefined) update.direction = input.direction
  if (input.category !== undefined) update.category = input.category
  if (input.amount !== undefined) update.amount = input.amount
  if (input.currency !== undefined) update.currency = input.currency
  if (input.occurred_at !== undefined) update.occurredAt = input.occurred_at || new Date().toISOString().slice(0, 10)
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.metadata !== undefined) update.metadata = input.metadata ?? {}
  if (input.project_id !== undefined) update.projectId = input.project_id

  const [row] = await db
    .update(crmTreasuryMovements)
    .set(update)
    .where(eq(crmTreasuryMovements.id, id))
    .returning()
  if (!row) throw new Error('Failed to update')
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function deleteTreasuryMovement(id: string): Promise<void> {
  const db = getDb()
  await db.delete(crmTreasuryMovements).where(eq(crmTreasuryMovements.id, id))
}

export async function getTreasuryTotalsInRange(
  from: string,
  to: string
): Promise<{ income: number; expense: number }> {
  const db = getDb()
  const rows = await db
    .select({
      direction: crmTreasuryMovements.direction,
      total: sql<number>`coalesce(sum(${crmTreasuryMovements.amount}), 0)::int`,
    })
    .from(crmTreasuryMovements)
    .where(
      and(
        sql`${crmTreasuryMovements.occurredAt} >= ${from}::date`,
        sql`${crmTreasuryMovements.occurredAt} <= ${to}::date`
      )
    )
    .groupBy(crmTreasuryMovements.direction)

  let income = 0
  let expense = 0
  for (const r of rows) {
    if (r.direction === 'income') income = r.total ?? 0
    if (r.direction === 'expense') expense = r.total ?? 0
  }
  return { income, expense }
}
