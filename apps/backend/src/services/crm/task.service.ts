/**
 * CRM task service
 */
import { getSupabase } from '../../lib/supabase.js'
import { logActivity } from './activity.service.js'
import type { CreateTaskInput, UpdateTaskInput } from '../../schemas/crm/task.schema.js'

export async function listTasksByProject(projectId: string): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}

export async function getTaskById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_tasks').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    project_id: projectId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'normal',
    due_date: input.due_date || null,
    assigned_to: input.assigned_to || null,
    sort_order: input.sort_order ?? 0,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_tasks').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const task = data as Record<string, unknown>
  await logActivity({
    entityType: 'task',
    entityId: task.id as string,
    action: 'created',
    description: `Tâche "${input.title}" créée`,
    metadata: { project_id: projectId },
    createdBy: createdBy ?? undefined,
  })
  return task
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = {}
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.status !== undefined) {
    update.status = input.status
    if (input.status === 'done') update.completed_at = new Date().toISOString()
  }
  if (input.priority !== undefined) update.priority = input.priority
  if (input.due_date !== undefined) update.due_date = input.due_date || null
  if (input.assigned_to !== undefined) update.assigned_to = input.assigned_to || null
  if (input.sort_order !== undefined) update.sort_order = input.sort_order

  const { data, error } = await supabase.from('crm_tasks').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  await logActivity({
    entityType: 'task',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return data as Record<string, unknown>
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('crm_tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
