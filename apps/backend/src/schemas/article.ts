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
  cover_image_credit: emptyStringToNull(z.string().max(500).optional().nullable()).optional(),
  cover_image_source: emptyStringToNull(z.string().max(500).optional().nullable()).optional(),
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
  cover_video_credit: emptyStringToNull(z.string().max(500).optional().nullable()).optional(),
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

const importArticleItemSchema = createArticleBodySchema
  .omit({ status: true, category_id: true })
  .partial({
    excerpt: true,
    content: true,
  })
  .extend({
    title: z.string().min(1, 'Le titre est requis').max(500),
    body: z.string().optional(),
    category_id: z.string().uuid().optional().nullable(),
    category: z.string().max(200).optional().nullable(),
    category_slug: z.string().max(200).optional().nullable(),
    rubrique: z.string().max(200).optional().nullable(),
  })

export const importArticlesBodySchema = z.preprocess(
  (value) => {
    if (Array.isArray(value)) return { articles: value }
    return value
  },
  z.object({
    articles: z.array(importArticleItemSchema).min(1).max(100),
  })
)

export type CreateArticleBody = z.infer<typeof createArticleBodySchema>
export type UpdateArticleBody = z.infer<typeof updateArticleBodySchema>
export type ImportArticlesBody = z.infer<typeof importArticlesBodySchema>
