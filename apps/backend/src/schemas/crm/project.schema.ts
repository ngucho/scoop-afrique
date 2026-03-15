import { z } from 'zod'

export const crmProjectStatusEnum = z.enum([
  'draft',
  'confirmed',
  'in_progress',
  'review',
  'delivered',
  'closed',
  'cancelled',
])

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  contact_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  devis_id: z.string().uuid().optional(),
  service_slug: z.string().optional(),
  description: z.string().optional(),
  objectives: z.string().optional(),
  deliverables_summary: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget_agreed: z.number().int().min(0).optional(),
  currency: z.string().optional().default('FCFA'),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
})

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: crmProjectStatusEnum.optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
