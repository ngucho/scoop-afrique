import { z } from 'zod'

export const adCampaignStatusSchema = z.enum(['draft', 'active', 'paused', 'ended'])

export const adCreativeFormatSchema = z.enum(['image', 'native', 'video'])

export const createAdSlotBodySchema = z.object({
  key: z.string().min(1).max(120).regex(/^[a-z0-9_-]+$/i),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  format: z.string().max(120).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

export const updateAdSlotBodySchema = createAdSlotBodySchema.partial().omit({ key: true })

export const createAdCampaignBodySchema = z.object({
  slot_id: z.string().uuid(),
  name: z.string().min(1).max(300),
  status: adCampaignStatusSchema.optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  priority: z.number().int().optional(),
  weight: z.number().int().min(0).max(100).optional(),
})

export const updateAdCampaignBodySchema = createAdCampaignBodySchema.partial()

export const createAdCreativeBodySchema = z.object({
  campaign_id: z.string().uuid(),
  headline: z.string().min(1).max(500),
  body: z.string().max(5000).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  link_url: z.string().url(),
  format: adCreativeFormatSchema.optional(),
  cta_label: z.string().max(120).nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  alt: z.string().max(500).nullable().optional(),
  weight: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
})

export const updateAdCreativeBodySchema = createAdCreativeBodySchema
  .partial()
  .omit({ campaign_id: true })

export const recordAdEventBodySchema = z.object({
  creative_id: z.string().uuid(),
  session_id: z.string().max(200).optional(),
  article_id: z.string().uuid().optional(),
  user_agent: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateAdSlotBody = z.infer<typeof createAdSlotBodySchema>
export type UpdateAdSlotBody = z.infer<typeof updateAdSlotBodySchema>
export type CreateAdCampaignBody = z.infer<typeof createAdCampaignBodySchema>
export type UpdateAdCampaignBody = z.infer<typeof updateAdCampaignBodySchema>
export type CreateAdCreativeBody = z.infer<typeof createAdCreativeBodySchema>
export type UpdateAdCreativeBody = z.infer<typeof updateAdCreativeBodySchema>
export type RecordAdEventBody = z.infer<typeof recordAdEventBodySchema>
