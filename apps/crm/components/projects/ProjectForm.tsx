'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, Input, Label, Textarea } from 'scoop'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  contact_id: z.string().uuid().optional().or(z.literal('')),
  organization_id: z.string().uuid().optional().or(z.literal('')),
  devis_id: z.string().uuid().optional().or(z.literal('')),
  service_slug: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  objectives: z.string().optional(),
  deliverables_summary: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget_agreed: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ProjectFormProps {
  projectId?: string
  defaultValues?: Partial<FormData>
  contacts?: Array<{ id: string; first_name?: string; last_name?: string }>
  organizations?: Array<{ id: string; name: string }>
  devis?: Array<{ id: string; reference: string; title: string }>
  services?: Array<{ slug: string; name: string }>
}

export function ProjectForm({
  projectId,
  defaultValues,
  contacts = [],
  organizations = [],
}: ProjectFormProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  })

  async function onSubmit(data: FormData) {
    const body = {
      ...data,
      contact_id: data.contact_id || undefined,
      organization_id: data.organization_id || undefined,
      devis_id: data.devis_id || undefined,
      service_slug: data.service_slug || undefined,
      budget_agreed: data.budget_agreed ?? undefined,
    }
    const url = projectId ? `/api/crm/projects/${projectId}` : '/api/crm/projects'
    const res = await fetch(url, {
      method: projectId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erreur lors de l\'enregistrement')
      return
    }
    toast.success(projectId ? 'Projet mis à jour' : 'Projet créé')
    router.push(`/projects/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          {...register('title')}
          className={errors.title ? 'border-destructive' : ''}
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>
      {contacts.length > 0 && (
        <div>
          <Label htmlFor="contact_id">Contact</Label>
          <select
            id="contact_id"
            {...register('contact_id')}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.id}
              </option>
            ))}
          </select>
        </div>
      )}
      {organizations.length > 0 && (
        <div>
          <Label htmlFor="organization_id">Organisation</Label>
          <select
            id="organization_id"
            {...register('organization_id')}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={3} placeholder="Description du projet..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Date début</Label>
          <Input id="start_date" type="date" {...register('start_date')} />
        </div>
        <div>
          <Label htmlFor="end_date">Date fin</Label>
          <Input id="end_date" type="date" {...register('end_date')} />
        </div>
      </div>
      <div>
        <Label htmlFor="budget_agreed">Budget (FCFA)</Label>
        <Input id="budget_agreed" type="number" {...register('budget_agreed')} min={0} />
      </div>
      <div>
        <Label htmlFor="notes">Notes (client)</Label>
        <Textarea id="notes" {...register('notes')} rows={2} placeholder="Notes partagées avec le client..." />
      </div>
      <div>
        <Label htmlFor="internal_notes">Notes internes</Label>
        <Textarea id="internal_notes" {...register('internal_notes')} rows={2} placeholder="Notes internes uniquement..." />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : projectId ? 'Mettre à jour' : 'Créer le projet'}
      </Button>
    </form>
  )
}
