/**
 * CRM services catalog — prestations (description, prix, unité)
 */
import { getSupabase } from '../../lib/supabase.js'
import type { CreateServiceInput, UpdateServiceInput } from '../../schemas/crm/service.schema.js'

export async function listServices(params?: {
  active?: boolean
  category?: string
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('crm_services').select('*', { count: 'exact' })

  if (params?.active !== undefined) q = q.eq('is_active', params.active)
  if (params?.category) q = q.eq('category', params.category)

  q = q.order('sort_order', { ascending: true }).order('name', { ascending: true })
  if (params?.limit) q = q.limit(params.limit)
  if (params?.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getServiceById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_services').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function getServiceBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_services').select('*').eq('slug', slug).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createService(
  input: CreateServiceInput
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const insert = {
    slug: input.slug.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    unit: input.unit?.trim() || 'unité',
    default_price: input.default_price ?? 0,
    currency: input.currency ?? 'FCFA',
    category: input.category?.trim() || null,
    is_active: input.is_active ?? true,
    sort_order: input.sort_order ?? 0,
  }
  const { data, error } = await supabase.from('crm_services').insert(insert).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = {}
  if (input.slug !== undefined) update.slug = input.slug.trim()
  if (input.name !== undefined) update.name = input.name.trim()
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.unit !== undefined) update.unit = input.unit.trim()
  if (input.default_price !== undefined) update.default_price = input.default_price
  if (input.currency !== undefined) update.currency = input.currency
  if (input.category !== undefined) update.category = input.category?.trim() || null
  if (input.is_active !== undefined) update.is_active = input.is_active
  if (input.sort_order !== undefined) update.sort_order = input.sort_order

  const { data, error } = await supabase.from('crm_services').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function deleteService(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('crm_services').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
