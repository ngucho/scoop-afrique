import { z } from 'zod'

export const crmPaymentMethodEnum = z.enum([
  'cash',
  'bank_transfer',
  'mobile_money',
  'wave',
  'orange_money',
  'check',
  'other',
])

export const createPaymentSchema = z.object({
  amount: z.number().int().positive('Montant > 0'),
  currency: z.string().optional().default('FCFA'),
  method: crmPaymentMethodEnum.optional().default('other'),
  reference: z.string().optional(),
  paid_at: z.string().optional(),
  notes: z.string().optional(),
})

export const updatePaymentSchema = createPaymentSchema.partial()

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
