/**
 * Article validation schemas.
 * Videos are always YouTube embeds (url). Images can be uploaded or URL.
 * Empty strings are coerced to null for optional URL/text fields.
 */
import { z } from 'zod'

const emptyStringToNull = <T>(schema: z.ZodType<T>) =>
  z.preprocess((val) => (val === '' ? null : val), schema)

export const articleStatusSchema = z.enum(['draft', 'review', 'scheduled', 'published'])

export const createArticleBodySchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(500),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  excerpt: emptyStringToNull(z.string().max(1000).optional().nullable()).optional(),
  category_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  content: z.unknown(), // JSONB rich-text blocks (TipTap doc)
  cover_image_url: emptyStringToNull(
    z.string().url().optional().nullable()
  ).optional(),
  video_url: emptyStringToNull(
    z
      .string()
      .refine(
        (url) =>
          !url ||
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url),
        'Video must be a YouTube URL'
      )
      .optional()
      .nullable()
  ).optional(),
  tags: z
    .array(z.string().min(1).max(100))
    .max(20)
    .optional()
    .default([]),
  status: articleStatusSchema.optional(),
  meta_title: emptyStringToNull(z.string().max(200).optional().nullable()).optional(),
  meta_description: emptyStringToNull(z.string().max(500).optional().nullable()).optional(),
  og_image_url: emptyStringToNull(
    z.string().url().optional().nullable()
  ).optional(),
  scheduled_at: z.string().datetime().optional().nullable(),
  author_display_name: z.string().max(200).optional(),
})

export const updateArticleBodySchema = createArticleBodySchema
  .omit({ author_display_name: true })
  .partial()
  .extend({ status: articleStatusSchema.optional() })

export type CreateArticleBody = z.infer<typeof createArticleBodySchema>
export type UpdateArticleBody = z.infer<typeof updateArticleBodySchema>
