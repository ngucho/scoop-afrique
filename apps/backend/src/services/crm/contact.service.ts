/**
 * CRM contact service
 */
import { getSupabase } from '../../lib/supabase.js'
import { logActivity } from './activity.service.js'
import type { CreateContactInput, UpdateContactInput } from '../../schemas/crm/contact.schema.js'

export async function listContacts(params: {
  type?: string
  search?: string
  limit?: number
  offset?: number
  archived?: boolean
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('crm_contacts').select('*', { count: 'exact' })

  if (params.type) q = q.eq('type', params.type)
  if (params.archived !== undefined) q = q.eq('is_archived', params.archived)
  if (params.search) {
    q = q.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%,company.ilike.%${params.search}%`
    )
  }

  q = q.order('created_at', { ascending: false })
  if (params.limit) q = q.limit(params.limit)
  if (params.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getContactById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_contacts').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createContact(
  input: CreateContactInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    type: input.type ?? 'prospect',
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
    company: input.company?.trim() || null,
    position: input.position?.trim() || null,
    country: input.country ?? 'CI',
    city: input.city?.trim() || null,
    source: input.source?.trim() || null,
    devis_request_id: input.devis_request_id || null,
    tags: input.tags ?? [],
    notes: input.notes?.trim() || null,
    assigned_to: input.assigned_to || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_contacts').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const contact = data as Record<string, unknown>
  await logActivity({
    entityType: 'contact',
    entityId: contact.id as string,
    action: 'created',
    description: `Contact ${input.first_name} ${input.last_name} créé`,
    createdBy: createdBy ?? undefined,
  })
  return contact
}

export async function updateContact(
  id: string,
  input: UpdateContactInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = {}
  if (input.type !== undefined) update.type = input.type
  if (input.first_name !== undefined) update.first_name = input.first_name.trim()
  if (input.last_name !== undefined) update.last_name = input.last_name.trim()
  if (input.email !== undefined) update.email = input.email?.trim() || null
  if (input.phone !== undefined) update.phone = input.phone?.trim() || null
  if (input.whatsapp !== undefined) update.whatsapp = input.whatsapp?.trim() || null
  if (input.company !== undefined) update.company = input.company?.trim() || null
  if (input.position !== undefined) update.position = input.position?.trim() || null
  if (input.country !== undefined) update.country = input.country
  if (input.city !== undefined) update.city = input.city?.trim() || null
  if (input.source !== undefined) update.source = input.source?.trim() || null
  if (input.devis_request_id !== undefined) update.devis_request_id = input.devis_request_id || null
  if (input.tags !== undefined) update.tags = input.tags
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.assigned_to !== undefined) update.assigned_to = input.assigned_to || null
  if (input.is_archived !== undefined) update.is_archived = input.is_archived

  const { data, error } = await supabase.from('crm_contacts').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  const contact = data as Record<string, unknown>
  await logActivity({
    entityType: 'contact',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return contact
}

export async function archiveContact(id: string, archivedBy?: string): Promise<void> {
  await updateContact(id, { is_archived: true }, archivedBy)
}
