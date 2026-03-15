import { z } from 'zod'
import { lineItemSchema } from './line-item.schema.js'

export const crmInvoiceStatusEnum = z.enum([
  'draft',
  'sent',
  'partial',
  'paid',
  'overdue',
  'cancelled',
])

export const createInvoiceSchema = z.object({
  contact_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  devis_id: z.string().uuid().optional(),
  line_items: z.array(lineItemSchema).min(1, 'Au moins une ligne requise'),
  tax_rate: z.number().min(0).max(100).optional().default(0),
  discount_amount: z.number().int().min(0).optional().default(0),
  currency: z.string().optional().default('FCFA'),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  status: crmInvoiceStatusEnum.optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
