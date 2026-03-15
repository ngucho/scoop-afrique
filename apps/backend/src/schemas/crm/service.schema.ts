import { z } from 'zod'

export const createServiceSchema = z.object({
  slug: z.string().min(1, 'Slug requis').regex(/^[a-z0-9_]+$/, 'Slug: minuscules, chiffres, underscores'),
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unité requise').default('unité'),
  default_price: z.number().int().min(0).default(0),
  currency: z.string().default('FCFA'),
  category: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
