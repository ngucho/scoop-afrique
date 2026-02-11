/**
 * Comment validation schemas.
 */
import { z } from 'zod'

export const createCommentBodySchema = z.object({
  body: z.string().min(1).max(5000),
  parent_id: z.string().uuid().optional().nullable(),
})

export const updateCommentBodySchema = z.object({
  body: z.string().min(1).max(5000).optional(),
})

export const moderateCommentBodySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
})

export type CreateCommentBody = z.infer<typeof createCommentBodySchema>
export type UpdateCommentBody = z.infer<typeof updateCommentBodySchema>
export type ModerateCommentBody = z.infer<typeof moderateCommentBodySchema>