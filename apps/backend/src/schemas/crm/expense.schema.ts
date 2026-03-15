import { z } from 'zod'

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  amount: z.number().int().positive('Montant > 0'),
  currency: z.string().optional().default('FCFA'),
  category: z.string().optional(),
  receipt_url: z.union([z.string().url(), z.literal('')]).optional(),
  incurred_at: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
