/**
 * Media validation schemas.
 * Images: upload to Supabase Storage OR provide a URL.
 * Videos: always a YouTube URL (no upload — embedded in the frontend).
 */
import { z } from 'zod'

/** Body for registering a media by URL (no upload). */
export const mediaUrlBodySchema = z.object({
  url: z.string().url(),
  alt: z.string().max(500).optional(),
  caption: z.string().max(1000).optional(),
})

export type MediaUrlBody = z.infer<typeof mediaUrlBodySchema>
