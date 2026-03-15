import { z } from 'zod'

export const crmReminderChannelEnum = z.enum(['email', 'whatsapp', 'both'])

export const createReminderSchema = z.object({
  contact_id: z.string().uuid(),
  invoice_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  type: z.string().min(1, 'Type requis'),
  channel: crmReminderChannelEnum.optional().default('both'),
  message: z.string().min(1, 'Message requis'),
  scheduled_at: z.string().optional(),
})

export type CreateReminderInput = z.infer<typeof createReminderSchema>
