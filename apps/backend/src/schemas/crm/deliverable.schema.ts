import { z } from 'zod'

export const crmDeliverableTypeEnum = z.enum([
  'video_short',
  'video_long',
  'post',
  'story',
  'article',
  'recap',
  'report',
  'other',
])

export const crmPlatformEnum = z.enum([
  'tiktok',
  'instagram',
  'facebook',
  'youtube',
  'threads',
  'website',
  'other',
])

export const createDeliverableSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  type: crmDeliverableTypeEnum.optional().default('post'),
  platform: crmPlatformEnum.optional().default('instagram'),
  url: z.union([z.string().url(), z.literal('')]).optional(),
  thumbnail_url: z.union([z.string().url(), z.literal('')]).optional(),
  published_at: z.string().optional(),
  notes: z.string().optional(),
})

export const updateDeliverableSchema = createDeliverableSchema.partial()

export const deliverableMetricsSchema = z.object({
  views: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  saves: z.number().int().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  engagement_rate: z.number().min(0).max(100).optional(),
  extra: z.record(z.unknown()).optional(),
})

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>
export type DeliverableMetricsInput = z.infer<typeof deliverableMetricsSchema>
