'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, Textarea, Select } from 'scoop'

const schema = z.object({
  slug: z.string().min(1, 'Slug requis').regex(/^[a-z0-9_]+$/, 'Slug: minuscules, chiffres, underscores'),
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unité requise').default('unité'),
  default_price: z.coerce.number().int().min(0).default(0),
  category: z.string().optional(),
  is_active: z.boolean().optional().default(true),
})

type FormData = z.infer<typeof schema>

const UNITS = [
  { value: 'unité', label: 'Unité' },
  { value: 'vidéo', label: 'Vidéo' },
  { value: 'post', label: 'Post' },
  { value: 'mois', label: 'Mois' },
  { value: 'jour', label: 'Jour' },
  { value: 'forfait', label: 'Forfait' },
]

const CATEGORIES = [
  { value: 'production', label: 'Production' },
  { value: 'contenu', label: 'Contenu' },
  { value: 'gestion', label: 'Gestion' },
  { value: 'conseil', label: 'Conseil' },
]

export function ServiceForm({
  serviceId,
  defaultValues,
}: {
  serviceId?: string
  defaultValues?: Record<string, unknown>
}) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues
      ? {
          slug: defaultValues.slug as string,
          name: defaultValues.name as string,
          description: defaultValues.description as string,
          unit: defaultValues.unit as string,
          default_price: defaultValues.default_price as number,
          category: defaultValues.category as string,
          is_active: defaultValues.is_active as boolean,
        }
      : { unit: 'unité', default_price: 0, is_active: true },
  })

  async function onSubmit(data: FormData) {
    const body = {
      ...data,
      category: data.category || undefined,
    }
    const url = serviceId ? `/api/crm/services/${serviceId}` : '/api/crm/services'
    const res = await fetch(url, {
      method: serviceId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error ?? 'Erreur')
      return
    }
    router.push('/services')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="slug">Slug (identifiant technique)</Label>
        <Input
          id="slug"
          {...register('slug')}
          placeholder="video_courte"
          className={errors.slug ? 'border-destructive' : ''}
          disabled={!!serviceId}
        />
        {errors.slug && (
          <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Vidéo courte (TikTok/Reels)"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Description détaillée de la prestation..."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="unit">Unité</Label>
          <Select
            id="unit"
            {...register('unit')}
            options={UNITS}
          />
        </div>
        <div>
          <Label htmlFor="default_price">Prix par défaut (FCFA)</Label>
          <Input
            id="default_price"
            type="number"
            {...register('default_price')}
            min={0}
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="category">Catégorie</Label>
        <Select
          id="category"
          {...register('category')}
          options={[{ value: '', label: '— Aucune —' }, ...CATEGORIES]}
        />
      </div>
      {serviceId && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            {...register('is_active', { setValueAs: (v) => v === true || v === 'on' })}
            className="rounded border-input"
          />
          <Label htmlFor="is_active">Prestation active</Label>
        </div>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : serviceId ? 'Mettre à jour' : 'Créer'}
      </Button>
    </form>
  )
}
