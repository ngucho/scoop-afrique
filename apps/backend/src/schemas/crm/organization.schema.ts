import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  type: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional().default('CI'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
})

export const updateOrganizationSchema = createOrganizationSchema.partial()

export const contactOrganizationSchema = z.object({
  contact_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role: z.string().optional(),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
