import { z } from 'zod'

export const crmTaskStatusEnum = z.enum(['todo', 'in_progress', 'done', 'blocked'])
export const crmTaskPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  status: crmTaskStatusEnum.optional().default('todo'),
  priority: crmTaskPriorityEnum.optional().default('normal'),
  due_date: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  sort_order: z.number().int().optional().default(0),
})

export const updateTaskSchema = createTaskSchema.partial()

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
