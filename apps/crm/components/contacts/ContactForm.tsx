'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, Select, Textarea } from 'scoop'

const schema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  type: z.enum(['prospect', 'client', 'partner', 'sponsor', 'influencer', 'other']).optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ContactForm({
  contactId,
  defaultValues,
}: {
  contactId?: string
  defaultValues?: Partial<FormData>
}) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { type: 'prospect' },
  })

  async function onSubmit(data: FormData) {
    const body = {
      ...data,
      email: data.email || undefined,
      country: data.country || 'CI',
    }
    const url = contactId ? `/api/crm/contacts/${contactId}` : '/api/crm/contacts'
    const res = await fetch(url, {
      method: contactId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error ?? 'Erreur')
      return
    }
    router.push(`/contacts/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="first_name">Prénom</Label>
          <Input
            id="first_name"
            {...register('first_name')}
            className={errors.first_name ? 'border-destructive' : ''}
          />
          {errors.first_name && (
            <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="last_name">Nom</Label>
          <Input
            id="last_name"
            {...register('last_name')}
            className={errors.last_name ? 'border-destructive' : ''}
          />
          {errors.last_name && (
            <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" {...register('phone')} />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" {...register('whatsapp')} />
        </div>
      </div>
      <div>
        <Label htmlFor="company">Entreprise</Label>
        <Input id="company" {...register('company')} placeholder="Raison sociale" />
      </div>
      <div>
        <Label htmlFor="position">Fonction / Poste</Label>
        <Input id="position" {...register('position')} placeholder="Ex: Directeur marketing" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="country">Pays</Label>
          <Input id="country" {...register('country')} placeholder="CI" />
        </div>
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input id="city" {...register('city')} placeholder="Abidjan" />
        </div>
      </div>
      <div>
        <Label htmlFor="source">Source</Label>
        <Input id="source" {...register('source')} placeholder="Site web, recommandation, salon..." />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          id="type"
          {...register('type')}
          options={[
            { value: 'prospect', label: 'Prospect' },
            { value: 'client', label: 'Client' },
            { value: 'partner', label: 'Partenaire' },
            { value: 'sponsor', label: 'Sponsor' },
            { value: 'influencer', label: 'Influenceur' },
            { value: 'other', label: 'Autre' },
          ]}
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          rows={3}
          placeholder="Notes internes..."
          className={errors.notes ? 'border-destructive' : ''}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  )
}
