/**
 * Devis requests (from brands form) — list and update for CRM
 */
import { getSupabase } from '../lib/supabase.js'

export async function listDevisRequests(params?: {
  limit?: number
  offset?: number
  treated?: boolean
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('devis_requests').select('*', { count: 'exact' })

  // No "treated" column in devis_requests - we can add one later or use a join with crm_contacts
  // For now we just list all
  q = q.order('created_at', { ascending: false })
  if (params?.limit) q = q.limit(params.limit)
  if (params?.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getDevisRequestById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('devis_requests').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function updateDevisRequestConversion(
  id: string,
  payload: { converted_to_contact_id?: string; converted_to_devis_id?: string }
): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const updates: Record<string, unknown> = {}
  if (payload.converted_to_contact_id !== undefined) {
    updates.converted_to_contact_id = payload.converted_to_contact_id || null
  }
  if (payload.converted_to_devis_id !== undefined) {
    updates.converted_to_devis_id = payload.converted_to_devis_id || null
  }
  if (Object.keys(updates).length === 0) return getDevisRequestById(id)

  const { data, error } = await supabase
    .from('devis_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}
