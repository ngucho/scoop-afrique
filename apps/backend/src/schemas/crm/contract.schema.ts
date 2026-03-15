import { z } from 'zod'

export const crmContractStatusEnum = z.enum([
  'draft',
  'sent',
  'signed',
  'expired',
  'cancelled',
])

export const createContractSchema = z.object({
  project_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  devis_id: z.string().uuid().optional(),
  type: z.string().optional().default('service'),
  title: z.string().min(1, 'Titre requis'),
  content: z.record(z.unknown()).optional().default({}),
  expires_at: z.string().optional(),
})

export const updateContractSchema = createContractSchema.partial().extend({
  status: crmContractStatusEnum.optional(),
  signed_at: z.string().optional(),
})

export type CreateContractInput = z.infer<typeof createContractSchema>
export type UpdateContractInput = z.infer<typeof updateContractSchema>
