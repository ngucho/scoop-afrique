/**
 * Reader contribution (tribune / event tip) validation.
 */
import { z } from 'zod'

export const createContributionBodySchema = z
  .object({
    kind: z.enum(['writing', 'event']),
    title: z.string().min(1).max(300),
    body: z.string().min(1).max(20000),
    event_location: z.string().max(500).optional().nullable(),
    event_starts_at: z.string().datetime().optional().nullable(),
    article_id: z.string().uuid().optional().nullable(),
    is_anonymous: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.kind === 'event') {
      if (!val.event_location?.trim() && !val.event_starts_at) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pour un événement, précisez un lieu ou une date.',
          path: ['event_location'],
        })
      }
    }
  })

export const moderateContributionBodySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']),
})

export const contributionVoteBodySchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
})

export const contributionReactionBodySchema = z.object({
  emoji: z.string().min(1).max(32),
})

export const contributionCommentBodySchema = z.object({
  body: z.string().min(1).max(8000),
  parent_id: z.string().uuid().optional().nullable(),
  is_anonymous: z.boolean().optional(),
})

export const updateContributionBodySchema = z
  .object({
    kind: z.enum(['writing', 'event']).optional(),
    title: z.string().min(1).max(300).optional(),
    body: z.string().min(1).max(20000).optional(),
    event_location: z.string().max(500).optional().nullable(),
    event_starts_at: z.string().datetime().optional().nullable(),
    article_id: z.string().uuid().optional().nullable(),
    is_anonymous: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'empty_patch' })

export const contributionReportBodySchema = z.object({
  reason: z.string().min(1).max(200),
  details: z.string().max(2000).optional().nullable(),
})

export type CreateContributionBody = z.infer<typeof createContributionBodySchema>
export type ModerateContributionBody = z.infer<typeof moderateContributionBodySchema>
