import { z } from 'zod'
import { lineItemSchema } from './line-item.schema.js'

export const crmDevisStatusEnum = z.enum([
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
])

export const createDevisSchema = z.object({
  contact_id: z.string().uuid().optional(),
  devis_request_id: z.string().uuid().optional(),
  service_slug: z.string().optional(),
  title: z.string().min(1, 'Titre requis'),
  line_items: z.array(lineItemSchema).min(1, 'Au moins une ligne requise'),
  tax_rate: z.number().min(0).max(100).optional().default(0),
  currency: z.string().optional().default('FCFA'),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

export const updateDevisSchema = createDevisSchema.partial().extend({
  status: crmDevisStatusEnum.optional(),
})

export type CreateDevisInput = z.infer<typeof createDevisSchema>
export type UpdateDevisInput = z.infer<typeof updateDevisSchema>
