import { z } from 'zod'

export const adCampaignStatusSchema = z.enum(['draft', 'active', 'paused', 'ended'])

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
  name: z.string().min(1).max(300),
  status: adCampaignStatusSchema.optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  priority: z.number().int().optional(),
  budget_cents: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
})

export const updateAdCampaignBodySchema = createAdCampaignBodySchema.partial()

export const createAdCreativeBodySchema = z.object({
  campaign_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  image_url: z.string().url(),
  link_url: z.string().url(),
  alt: z.string().max(500).nullable().optional(),
  weight: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
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
