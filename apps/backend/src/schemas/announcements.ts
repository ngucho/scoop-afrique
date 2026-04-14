import { z } from 'zod'

export const announcementPlacementSchema = z.enum(['banner', 'modal', 'inline', 'footer', 'sidebar'])

export const createAnnouncementBodySchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(20000),
  placement: announcementPlacementSchema.optional(),
  priority: z.number().int().optional(),
  link_url: z.string().url().nullable().optional(),
  is_active: z.boolean().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
})

export const updateAnnouncementBodySchema = createAnnouncementBodySchema.partial()

export type CreateAnnouncementBody = z.infer<typeof createAnnouncementBodySchema>
export type UpdateAnnouncementBody = z.infer<typeof updateAnnouncementBodySchema>
