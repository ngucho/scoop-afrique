/**
 * CRM organization service
 */
import { getSupabase } from '../../lib/supabase.js'
import type { CreateOrganizationInput, UpdateOrganizationInput } from '../../schemas/crm/organization.schema.js'

export async function listOrganizations(params?: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('crm_organizations').select('*', { count: 'exact' })

  if (params?.search) {
    q = q.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  q = q.order('name', { ascending: true })
  if (params?.limit) q = q.limit(params.limit)
  if (params?.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getOrganizationById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_organizations').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createOrganization(
  input: CreateOrganizationInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    name: input.name.trim(),
    type: input.type?.trim() || null,
    website: input.website?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    country: input.country ?? 'CI',
    notes: input.notes?.trim() || null,
    tags: input.tags ?? [],
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_organizations').insert(insert).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = {}
  if (input.name !== undefined) update.name = input.name.trim()
  if (input.type !== undefined) update.type = input.type?.trim() || null
  if (input.website !== undefined) update.website = input.website?.trim() || null
  if (input.email !== undefined) update.email = input.email?.trim() || null
  if (input.phone !== undefined) update.phone = input.phone?.trim() || null
  if (input.address !== undefined) update.address = input.address?.trim() || null
  if (input.country !== undefined) update.country = input.country
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.tags !== undefined) update.tags = input.tags

  const { data, error } = await supabase.from('crm_organizations').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function getContactOrganizations(contactId: string): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data: links, error } = await supabase
    .from('crm_contact_organization')
    .select('organization_id, role')
    .eq('contact_id', contactId)
  if (error) throw new Error(error.message)
  if (!links?.length) return []

  const ids = links.map((l) => l.organization_id)
  const { data: orgs, error: orgError } = await supabase
    .from('crm_organizations')
    .select('id, name, type')
    .in('id', ids)
  if (orgError) throw new Error(orgError.message)

  const roleByOrg = Object.fromEntries(links.map((l) => [l.organization_id, l.role]))
  return (orgs ?? []).map((o) => ({
    ...o,
    role: roleByOrg[o.id as string] ?? null,
  })) as Array<Record<string, unknown>>
}

export async function getOrganizationContacts(organizationId: string): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data: links, error } = await supabase
    .from('crm_contact_organization')
    .select('contact_id, role')
    .eq('organization_id', organizationId)
  if (error) throw new Error(error.message)
  if (!links?.length) return []

  const ids = links.map((l) => l.contact_id)
  const { data: contacts, error: contactError } = await supabase
    .from('crm_contacts')
    .select('id, first_name, last_name, email')
    .in('id', ids)
  if (contactError) throw new Error(contactError.message)

  const roleByContact = Object.fromEntries(links.map((l) => [l.contact_id, l.role]))
  return (contacts ?? []).map((c) => ({
    ...c,
    role: roleByContact[c.id as string] ?? null,
  })) as Array<Record<string, unknown>>
}

export async function linkContactOrganization(
  contactId: string,
  organizationId: string,
  role?: string
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('crm_contact_organization').upsert(
    { contact_id: contactId, organization_id: organizationId, role: role ?? null },
    { onConflict: 'contact_id,organization_id' }
  )
  if (error) throw new Error(error.message)
}

export async function unlinkContactOrganization(
  contactId: string,
  organizationId: string
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('crm_contact_organization')
    .delete()
    .eq('contact_id', contactId)
    .eq('organization_id', organizationId)
  if (error) throw new Error(error.message)
}
