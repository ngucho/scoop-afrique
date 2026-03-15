/**
 * CRM expense service
 */
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmExpenses } from '../../db/schema.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateExpenseInput } from '../../schemas/crm/expense.schema.js'

export async function listExpensesByProject(projectId: string): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const rows = await db
    .select()
    .from(crmExpenses)
    .where(eq(crmExpenses.projectId, projectId))
    .orderBy(desc(crmExpenses.createdAt))
  return rows.map((r) => toSnakeRecord(r as Record<string, unknown>))
}

export async function createExpense(
  projectId: string,
  input: CreateExpenseInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const [expense] = await db
    .insert(crmExpenses)
    .values({
      projectId,
      title: input.title.trim(),
      amount: input.amount,
      currency: input.currency ?? 'FCFA',
      category: input.category?.trim() || null,
      receiptUrl: input.receipt_url?.trim() || null,
      incurredAt: input.incurred_at || new Date().toISOString().slice(0, 10),
      notes: input.notes?.trim() || null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!expense) throw new Error('Failed to create expense')
  return toSnakeRecord(expense as Record<string, unknown>)
}
