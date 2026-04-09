import { z } from 'zod'

export const digestFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'off'])

export const updateReaderAccountBodySchema = z.object({
  topic_category_ids: z.array(z.string().uuid()).max(50).optional(),
  digest_frequency: digestFrequencySchema.optional(),
})
