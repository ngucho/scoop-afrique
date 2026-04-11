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

/** Base64 image (no data: prefix), max 3 MiB decoded — enforced server-side */
export const mediaImgbbBodySchema = z.object({
  image: z.string().min(20).max(5_500_000),
  alt: z.string().max(500).optional(),
  caption: z.string().max(1000).optional(),
  name: z.string().max(200).optional(),
})

export type MediaImgbbBody = z.infer<typeof mediaImgbbBodySchema>
