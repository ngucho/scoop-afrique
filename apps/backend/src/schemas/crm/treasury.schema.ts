import { z } from 'zod'

export const treasuryDirectionEnum = z.enum(['income', 'expense'])

export const treasuryIncomeCategories = [
  'monetization',
  'donation',
  'merch_sale',
  'capital',
  'services_other',
  'other_income',
] as const

export const treasuryExpenseCategories = [
  'salary',
  'rent',
  'utilities',
  'transport',
  'purchases',
  'operating_fees',
  'marketing',
  'other_expense',
] as const

const treasuryMovementBase = z.object({
  direction: treasuryDirectionEnum,
  category: z.string().min(1, 'Catégorie requise'),
  amount: z.number().int().positive('Montant > 0'),
  currency: z.string().optional().default('FCFA'),
  occurred_at: z.string().optional(),
  title: z.string().min(1, 'Titre requis'),
  notes: z.string().optional(),
  /** Lien vers justificatif (image / PDF hébergé) */
  receipt_url: z.union([z.string().url(), z.literal('')]).optional(),
  metadata: z.record(z.unknown()).optional(),
  project_id: z.string().uuid().optional().nullable(),
})

function refineCategoryForDirection(
  data: { direction?: 'income' | 'expense'; category?: string },
  ctx: z.RefinementCtx
) {
  if (data.direction == null || data.category == null) return
  const inc = new Set(treasuryIncomeCategories)
  const exp = new Set(treasuryExpenseCategories)
  if (data.direction === 'income' && !inc.has(data.category as (typeof treasuryIncomeCategories)[number])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Catégorie de revenu invalide: ${data.category}`,
    })
  }
  if (data.direction === 'expense' && !exp.has(data.category as (typeof treasuryExpenseCategories)[number])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Catégorie de dépense invalide: ${data.category}`,
    })
  }
}

export const createTreasuryMovementSchema = treasuryMovementBase.superRefine(refineCategoryForDirection)

export const updateTreasuryMovementSchema = treasuryMovementBase
  .partial()
  .superRefine(refineCategoryForDirection)

export type CreateTreasuryMovementInput = z.infer<typeof createTreasuryMovementSchema>
export type UpdateTreasuryMovementInput = z.infer<typeof updateTreasuryMovementSchema>
