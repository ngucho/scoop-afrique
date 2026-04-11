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
  status: z.enum(['pending', 'approved', 'rejected']),
})

export type CreateContributionBody = z.infer<typeof createContributionBodySchema>
export type ModerateContributionBody = z.infer<typeof moderateContributionBodySchema>
