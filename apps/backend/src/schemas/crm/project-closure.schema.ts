import { z } from 'zod'

const closureTypeSchema = z.enum([
  'completed',
  'client_abandoned',
  'mutual_termination',
  'company_cancelled',
])

export const invoiceResolutionSchema = z
  .object({
    invoice_id: z.string().uuid(),
    type: z.enum(['credit_note', 'bad_debt']),
    amount: z.number().int().positive(),
    reason: z.string().trim().min(1).max(2000),
    external_reference: z.string().trim().min(1).max(500).optional(),
    evidence_url: z.string().url().optional(),
    manager_attestation: z.literal(true).optional(),
  })
  .superRefine((resolution, context) => {
    if (resolution.type === 'bad_debt' && !resolution.evidence_url && !resolution.manager_attestation) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Preuve ou attestation manager requise', path: ['evidence_url'] })
    }
  })

export const closeProjectSchema = z.object({
  closure_type: closureTypeSchema,
  reason: z.string().trim().min(10).max(2000),
  closure_version: z.number().int().nonnegative(),
  preview_fingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  invoice_resolutions: z.array(invoiceResolutionSchema),
})

export type CloseProjectRequest = z.infer<typeof closeProjectSchema>
