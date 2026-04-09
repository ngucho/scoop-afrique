import { z } from 'zod'
import { digestFrequencySchema } from './subscribers.js'

export const newsletterCampaignStatusSchema = z.enum([
  'draft',
  'scheduled',
  'sending',
  'sent',
  'cancelled',
])

export const createNewsletterCampaignBodySchema = z.object({
  name: z.string().min(1).max(300),
  segment_id: z.string().uuid().nullable().optional(),
  frequency: digestFrequencySchema.optional(),
  status: newsletterCampaignStatusSchema.optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
  subject: z.string().max(500).nullable().optional(),
  template_key: z.string().max(120).nullable().optional(),
  stats: z.record(z.unknown()).optional(),
})

export const updateNewsletterCampaignBodySchema = createNewsletterCampaignBodySchema.partial()

export type CreateNewsletterCampaignBody = z.infer<typeof createNewsletterCampaignBodySchema>
export type UpdateNewsletterCampaignBody = z.infer<typeof updateNewsletterCampaignBodySchema>

export const enqueueDigestBodySchema = z.object({
  frequency: digestFrequencySchema,
  campaign_id: z.string().uuid().optional(),
  scheduled_for: z.string().datetime().optional(),
  send_now: z.boolean().optional(),
})

export const digestJobStatusSchema = z.enum(['pending', 'processing', 'sent', 'failed'])
