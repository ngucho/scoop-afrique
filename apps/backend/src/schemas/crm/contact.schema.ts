import { z } from 'zod'

export const crmContactTypeEnum = z.enum([
  'prospect',
  'client',
  'partner',
  'sponsor',
  'influencer',
  'other',
])

export const createContactSchema = z.object({
  type: crmContactTypeEnum.optional().default('prospect'),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  country: z.string().optional().default('CI'),
  city: z.string().optional(),
  source: z.string().optional(),
  devis_request_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
})

export const updateContactSchema = createContactSchema.partial().extend({
  is_archived: z.boolean().optional(),
})

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
