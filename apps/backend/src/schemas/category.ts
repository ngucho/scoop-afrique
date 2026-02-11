/**
 * Category validation schemas.
 */
import { z } from 'zod'

export const createCategoryBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().max(1000).optional().nullable(),
})

export const updateCategoryBodySchema = createCategoryBodySchema.partial()

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>
