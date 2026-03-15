/**
 * CRM reminder service
 */
import { getSupabase } from '../../lib/supabase.js'
import type { CreateReminderInput } from '../../schemas/crm/reminder.schema.js'

export async function listReminders(params?: {
  contactId?: string
  invoiceId?: string
  status?: 'pending' | 'sent'
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('crm_reminders').select('*', { count: 'exact' })

  if (params?.contactId) q = q.eq('contact_id', params.contactId)
  if (params?.invoiceId) q = q.eq('invoice_id', params.invoiceId)
  if (params?.status === 'pending') {
    q = q.is('sent_at', null).not('scheduled_at', 'is', null)
  } else if (params?.status === 'sent') {
    q = q.not('sent_at', 'is', null)
  }

  q = q.order('created_at', { ascending: false })
  if (params?.limit) q = q.limit(params.limit)
  if (params?.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getReminderById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_reminders').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createReminder(
  input: CreateReminderInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    contact_id: input.contact_id,
    invoice_id: input.invoice_id || null,
    project_id: input.project_id || null,
    type: input.type.trim(),
    channel: input.channel ?? 'both',
    message: input.message.trim(),
    scheduled_at: input.scheduled_at || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_reminders').insert(insert).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function markReminderSent(id: string): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_reminders')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}
