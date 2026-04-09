import { z } from 'zod'

export const digestFrequencySchema = z.enum(['daily', 'weekly', 'monthly'])
export type DigestFrequency = z.infer<typeof digestFrequencySchema>

export const createSubscriberSegmentBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  filter: z.record(z.unknown()).optional(),
})

export const updateSubscriberSegmentBodySchema = createSubscriberSegmentBodySchema.partial()

export const createSubscriberProfileBodySchema = z.object({
  profile_id: z.string().uuid(),
  newsletter_subscriber_id: z.string().uuid().nullable().optional(),
  display_name: z.string().max(200).nullable().optional(),
})

export const updateSubscriberProfileBodySchema = createSubscriberProfileBodySchema
  .partial()
  .omit({ profile_id: true })

export const upsertSubscriberPreferencesBodySchema = z.object({
  frequency: digestFrequencySchema,
  category_ids: z.array(z.string().uuid()).default([]),
})

export type CreateSubscriberSegmentBody = z.infer<typeof createSubscriberSegmentBodySchema>
export type UpdateSubscriberSegmentBody = z.infer<typeof updateSubscriberSegmentBodySchema>
export type CreateSubscriberProfileBody = z.infer<typeof createSubscriberProfileBodySchema>
export type UpdateSubscriberProfileBody = z.infer<typeof updateSubscriberProfileBodySchema>
export type UpsertSubscriberPreferencesBody = z.infer<typeof upsertSubscriberPreferencesBodySchema>
