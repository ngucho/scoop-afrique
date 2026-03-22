'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, Input, Label, Textarea } from 'scoop'

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  type: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function OrganizationForm({
  orgId,
  defaultValues,
}: {
  orgId?: string
  defaultValues?: Partial<FormData>
}) {
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
      email: data.email || undefined,
      website: data.website || undefined,
      country: data.country || 'CI',
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    }
    const url = orgId ? `/api/crm/organizations/${orgId}` : '/api/crm/organizations'
    const res = await fetch(url, {
      method: orgId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erreur lors de l\'enregistrement')
      return
    }
    toast.success(orgId ? 'Organisation mise à jour' : 'Organisation créée')
    router.push(`/organizations/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <Input
          id="type"
          list="org-form-type-suggestions"
          {...register('type')}
          placeholder="Saisie libre : PME, label, ONG, média…"
        />
        <datalist id="org-form-type-suggestions">
          {['media', 'marque', 'agence', 'ONG', 'startup', 'institution', 'PME', 'label', 'autre'].map(
            (s) => (
              <option key={s} value={s} />
            )
          )}
        </datalist>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
      </div>
      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" {...register('phone')} />
      </div>
      <div>
        <Label htmlFor="website">Site web</Label>
        <Input id="website" type="url" {...register('website')} />
      </div>
      <div>
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" {...register('address')} placeholder="Adresse complète" />
      </div>
      <div>
        <Label htmlFor="country">Pays</Label>
        <Input id="country" {...register('country')} placeholder="CI" />
      </div>
      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" {...register('tags')} placeholder="tag1, tag2, tag3" />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} rows={3} placeholder="Notes internes..." />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  )
}
