import { z } from 'zod'

export const devisBodySchema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  company: z.string().optional(),
  service_slug: z.string().optional(),
  budget_min: z.number().int().min(0).optional(),
  budget_max: z.number().int().min(0).optional(),
  budget_currency: z.string().default('FCFA'),
  preferred_date: z.string().optional(),
  deadline: z.string().optional(),
  description: z.string().min(10, 'Décrivez votre projet (min. 10 caractères)'),
  source_url: z.string().url().optional(),
})

export type DevisBody = z.infer<typeof devisBodySchema>
