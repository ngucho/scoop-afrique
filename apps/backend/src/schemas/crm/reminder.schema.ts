import { z } from 'zod'

export const crmReminderChannelEnum = z.enum(['email', 'whatsapp', 'both'])

export const crmReminderStatusEnum = z.enum([
  'draft',
  'scheduled',
  'sent',
  'replied',
  'successful',
  'closed',
  'cancelled',
])

export const createReminderSchema = z.object({
  contact_id: z.string().uuid(),
  invoice_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  type: z.string().min(1, 'Type requis'),
  channel: crmReminderChannelEnum.optional().default('both'),
  message: z.string().min(1, 'Message requis'),
  scheduled_at: z.string().optional(),
})

export const updateReminderSchema = z.object({
  contact_id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  type: z.string().min(1).optional(),
  channel: crmReminderChannelEnum.optional(),
  message: z.string().min(1).optional(),
  scheduled_at: z.string().nullable().optional(),
  status: crmReminderStatusEnum.optional(),
})

export type CreateReminderInput = z.infer<typeof createReminderSchema>
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>
