/**
 * CRM expense service
 */
import { getSupabase } from '../../lib/supabase.js'
import type { CreateExpenseInput } from '../../schemas/crm/expense.schema.js'

export async function listExpensesByProject(projectId: string): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('incurred_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}

export async function createExpense(
  projectId: string,
  input: CreateExpenseInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    project_id: projectId,
    title: input.title.trim(),
    amount: input.amount,
    currency: input.currency ?? 'FCFA',
    category: input.category?.trim() || null,
    receipt_url: input.receipt_url?.trim() || null,
    incurred_at: input.incurred_at || new Date().toISOString().slice(0, 10),
    notes: input.notes?.trim() || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_expenses').insert(insert).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}
