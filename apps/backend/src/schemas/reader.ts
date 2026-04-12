import { z } from 'zod'

export const digestFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'off'])

export const updateReaderAccountBodySchema = z.object({
  topic_category_ids: z.array(z.string().uuid()).max(50).optional(),
  digest_frequency: digestFrequencySchema.optional(),
  display_name: z.string().min(1).max(200).optional().nullable(),
  pseudo: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
      z
        .string()
        .min(2)
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/)
        .optional()
        .nullable(),
    ),
  avatar_url: z.string().url().max(2000).optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  address_line1: z.string().max(300).optional().nullable(),
  address_line2: z.string().max(300).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  postal_code: z.string().max(32).optional().nullable(),
  country_code: z.string().max(8).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  interest_category_ids: z.array(z.string().uuid()).max(50).optional(),
  sync_auth0: z.boolean().optional(),
})
