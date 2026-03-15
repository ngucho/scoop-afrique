import { z } from 'zod'

export const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.number().positive('Quantité > 0'),
  unit_price: z.number().int().min(0, 'Prix unitaire >= 0'),
  unit: z.string().optional().default('unité'),
  tax_rate: z.number().min(0).max(100).optional().default(0),
  total: z.number().int().optional(),
})

export type LineItem = z.infer<typeof lineItemSchema>
