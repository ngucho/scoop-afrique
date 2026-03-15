/**
 * CRM task service
 */
import { eq, asc } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { crmTasks } from '../../db/schema.js'
import { logActivity } from './activity.service.js'
import { toSnakeRecord } from './crm-util.js'
import type { CreateTaskInput, UpdateTaskInput } from '../../schemas/crm/task.schema.js'

export async function listTasksByProject(projectId: string): Promise<Array<Record<string, unknown>>> {
  const db = getDb()
  const rows = await db
    .select()
    .from(crmTasks)
    .where(eq(crmTasks.projectId, projectId))
    .orderBy(asc(crmTasks.sortOrder), asc(crmTasks.createdAt))
  return rows.map((r) => toSnakeRecord(r as Record<string, unknown>))
}

export async function getTaskById(id: string): Promise<Record<string, unknown> | null> {
  const db = getDb()
  const rows = await db.select().from(crmTasks).where(eq(crmTasks.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toSnakeRecord(row as Record<string, unknown>)
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const [task] = await db
    .insert(crmTasks)
    .values({
      projectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: (input.status ?? 'todo') as typeof crmTasks.status.enumValues[number],
      priority: (input.priority ?? 'normal') as typeof crmTasks.priority.enumValues[number],
      dueDate: input.due_date || null,
      assignedTo: input.assigned_to || null,
      createdBy: createdBy ?? null,
    })
    .returning()

  if (!task) throw new Error('Failed to create task')
  await logActivity({
    entityType: 'task',
    entityId: task.id,
    action: 'created',
    description: `Tâche "${input.title}" créée`,
    metadata: { project_id: projectId },
    createdBy: createdBy ?? undefined,
  })
  return toSnakeRecord(task as Record<string, unknown>)
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  updatedBy?: string
): Promise<Record<string, unknown>> {
  const db = getDb()
  const update: Partial<typeof crmTasks.$inferInsert> = {}
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.status !== undefined) {
    update.status = input.status as typeof crmTasks.status.enumValues[number]
    if (input.status === 'done') update.completedAt = new Date()
  }
  if (input.priority !== undefined) update.priority = input.priority as typeof crmTasks.priority.enumValues[number]
  if (input.due_date !== undefined) update.dueDate = input.due_date || null
  if (input.assigned_to !== undefined) update.assignedTo = input.assigned_to || null
  if (input.sort_order !== undefined) update.sortOrder = input.sort_order

  const [task] = await db.update(crmTasks).set(update).where(eq(crmTasks.id, id)).returning()
  if (!task) throw new Error('Failed to update task')
  await logActivity({
    entityType: 'task',
    entityId: id,
    action: 'updated',
    createdBy: updatedBy ?? undefined,
  })
  return toSnakeRecord(task as Record<string, unknown>)
}

export async function deleteTask(id: string): Promise<void> {
  const db = getDb()
  await db.delete(crmTasks).where(eq(crmTasks.id, id))
}
