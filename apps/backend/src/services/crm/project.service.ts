/**
 * CRM project service
 */
import { getSupabase } from '../../lib/supabase.js'
import { nextReference } from '../../lib/reference.js'
import { logActivity } from './activity.service.js'
import type { CreateProjectInput, UpdateProjectInput } from '../../schemas/crm/project.schema.js'

export async function listProjects(params?: {
  contactId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
  const supabase = getSupabase()
  let q = supabase.from('crm_projects').select('*', { count: 'exact' })

  if (params?.contactId) q = q.eq('contact_id', params.contactId)
  if (params?.status) q = q.eq('status', params.status)

  q = q.order('created_at', { ascending: false })
  if (params?.limit) q = q.limit(params.limit)
  if (params?.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as Array<Record<string, unknown>>, total: count ?? 0 }
}

export async function getProjectById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_projects').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createProject(
  input: CreateProjectInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const reference = await nextReference('PRJ')

  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    reference,
    title: input.title.trim(),
    contact_id: input.contact_id || null,
    organization_id: input.organization_id || null,
    devis_id: input.devis_id || null,
    service_slug: input.service_slug?.trim() || null,
    description: input.description?.trim() || null,
    objectives: input.objectives?.trim() || null,
    deliverables_summary: input.deliverables_summary?.trim() || null,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    budget_agreed: input.budget_agreed ?? null,
    currency: input.currency ?? 'FCFA',
    notes: input.notes?.trim() || null,
    internal_notes: input.internal_notes?.trim() || null,
    assigned_to: input.assigned_to || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_projects').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const project = data as Record<string, unknown>
  await logActivity({
    entityType: 'project',
    entityId: project.id as string,
    action: 'created',
    description: `Projet ${reference} créé`,
    createdBy: createdBy ?? undefined,
  })
  return project
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = {}
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.contact_id !== undefined) update.contact_id = input.contact_id || null
  if (input.organization_id !== undefined) update.organization_id = input.organization_id || null
  if (input.devis_id !== undefined) update.devis_id = input.devis_id || null
  if (input.service_slug !== undefined) update.service_slug = input.service_slug?.trim() || null
  if (input.status !== undefined) update.status = input.status
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.objectives !== undefined) update.objectives = input.objectives?.trim() || null
  if (input.deliverables_summary !== undefined)
    update.deliverables_summary = input.deliverables_summary?.trim() || null
  if (input.start_date !== undefined) update.start_date = input.start_date || null
  if (input.end_date !== undefined) update.end_date = input.end_date || null
  if (input.budget_agreed !== undefined) update.budget_agreed = input.budget_agreed ?? null
  if (input.currency !== undefined) update.currency = input.currency
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.internal_notes !== undefined) update.internal_notes = input.internal_notes?.trim() || null
  if (input.assigned_to !== undefined) update.assigned_to = input.assigned_to || null

  const { data, error } = await supabase.from('crm_projects').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  const project = data as Record<string, unknown>
  await logActivity({
    entityType: 'project',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return project
}

// ── Project Contacts (many-to-many) ──────────────────────────────────

export async function getProjectContacts(projectId: string): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_project_contacts')
    .select('*, contact:crm_contacts(id, first_name, last_name, email, company, type)')
    .eq('project_id', projectId)
    .order('is_primary', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}

export async function addProjectContact(
  projectId: string,
  contactId: string,
  role: string = 'client',
  isPrimary: boolean = false
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  // If setting as primary, unset existing primary first
  if (isPrimary) {
    await supabase
      .from('crm_project_contacts')
      .update({ is_primary: false })
      .eq('project_id', projectId)
      .eq('is_primary', true)
  }
  const { data, error } = await supabase
    .from('crm_project_contacts')
    .upsert({ project_id: projectId, contact_id: contactId, role, is_primary: isPrimary }, {
      onConflict: 'project_id,contact_id',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function removeProjectContact(projectId: string, contactId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('crm_project_contacts')
    .delete()
    .eq('project_id', projectId)
    .eq('contact_id', contactId)
  if (error) throw new Error(error.message)
}

export async function closeProject(id: string, closedBy?: string): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_projects')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await logActivity({
    entityType: 'project',
    entityId: id,
    action: 'closed',
    createdBy: closedBy ?? undefined,
  })
  return data as Record<string, unknown>
}
