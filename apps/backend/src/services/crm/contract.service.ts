/**
 * CRM contract service
 */
import { getSupabase } from '../../lib/supabase.js'
import { nextReference } from '../../lib/reference.js'
import { logActivity } from './activity.service.js'
import type { CreateContractInput, UpdateContractInput } from '../../schemas/crm/contract.schema.js'

export async function listContracts(params?: {
  projectId?: string
  contactId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('crm_contracts').select('*', { count: 'exact' })

  if (params?.projectId) q = q.eq('project_id', params.projectId)
  if (params?.contactId) q = q.eq('contact_id', params.contactId)
  if (params?.status) q = q.eq('status', params.status)

  q = q.order('created_at', { ascending: false })
  if (params?.limit) q = q.limit(params.limit)
  if (params?.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getContractById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_contracts').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function getContractWithContact(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_contracts')
    .select(
      `
      *,
      crm_contacts (
        id, first_name, last_name, email, company
      )
    `
    )
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createContract(
  input: CreateContractInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const reference = await nextReference('CTR')

  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    reference,
    project_id: input.project_id || null,
    contact_id: input.contact_id || null,
    devis_id: input.devis_id || null,
    type: input.type ?? 'service',
    title: input.title.trim(),
    content: input.content ?? {},
    expires_at: input.expires_at || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_contracts').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const contract = data as Record<string, unknown>
  await logActivity({
    entityType: 'contract',
    entityId: contract.id as string,
    action: 'created',
    description: `Contrat ${reference} créé`,
    createdBy: createdBy ?? undefined,
  })
  return contract
}

export async function updateContract(
  id: string,
  input: UpdateContractInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = {}
  if (input.project_id !== undefined) update.project_id = input.project_id || null
  if (input.contact_id !== undefined) update.contact_id = input.contact_id || null
  if (input.devis_id !== undefined) update.devis_id = input.devis_id || null
  if (input.type !== undefined) update.type = input.type
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.content !== undefined) update.content = input.content
  if (input.expires_at !== undefined) update.expires_at = input.expires_at || null
  if (input.status !== undefined) update.status = input.status
  if (input.signed_at !== undefined) update.signed_at = input.signed_at || null

  const { data, error } = await supabase.from('crm_contracts').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  const contract = data as Record<string, unknown>
  await logActivity({
    entityType: 'contract',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return contract
}

export async function markContractSigned(id: string, signedBy?: string): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_contracts')
    .update({ status: 'signed', signed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await logActivity({
    entityType: 'contract',
    entityId: id,
    action: 'signed',
    createdBy: signedBy ?? undefined,
  })
  return data as Record<string, unknown>
}

export async function setContractPdfUrl(id: string, pdfUrl: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('crm_contracts').update({ pdf_url: pdfUrl }).eq('id', id)
}
