'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, Input, Label, Textarea } from 'scoop'

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().positive('Quantité > 0'),
  unit_price: z.coerce.number().int().min(0, 'Prix >= 0'),
  unit: z.string().optional().default('unité'),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
})

const createSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  project_id: z.string().min(1, 'Sélectionnez un projet'),
  contact_id: z.string().uuid().optional().or(z.literal('')),
  devis_request_id: z.string().uuid().optional().or(z.literal('')),
  service_slug: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, 'Au moins une ligne requise'),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

const editSchema = createSchema.extend({
  project_id: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof createSchema>

interface Service {
  id: string
  slug: string
  name: string
  description?: string
  unit: string
  default_price: number
}

interface Project {
  id: string
  reference: string
  title: string
  contact?: { first_name?: string; last_name?: string }
}

interface DevisBuilderProps {
  devisId?: string
  defaultValues?: Partial<FormData>
  projects?: Project[]
  contacts?: Array<{ id: string; first_name?: string; last_name?: string }>
  services?: Service[]
}

export function DevisBuilder({
  devisId,
  defaultValues,
  projects = [],
  contacts = [],
  services = [],
}: DevisBuilderProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(devisId ? editSchema : createSchema),
    defaultValues: defaultValues ?? {
      line_items: [{ description: '', quantity: 1, unit_price: 0, unit: 'unité' }],
      tax_rate: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })
  const lineItems = watch('line_items')
  const taxRate = watch('tax_rate') ?? 0

  function addServiceLine(s: Service) {
    append({
      description: s.name,
      quantity: 1,
      unit_price: s.default_price,
      unit: s.unit,
      tax_rate: 0,
    })
  }

  const subtotal =
    lineItems?.reduce(
      (sum, i) => sum + (i.quantity ?? 0) * (i.unit_price ?? 0),
      0
    ) ?? 0
  const taxAmount = Math.round(subtotal * (taxRate / 100))
  const total = subtotal + taxAmount

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    const body = {
      ...data,
      project_id: data.project_id || undefined,
      contact_id: data.contact_id || undefined,
      devis_request_id: data.devis_request_id || undefined,
      line_items: data.line_items.map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        tax_rate: Number(i.tax_rate) ?? 0,
      })),
    }
    const url = devisId ? `/api/crm/devis/${devisId}` : '/api/crm/devis'
    const res = await fetch(url, {
      method: devisId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const json = await res.json()
    setIsSubmitting(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Erreur lors de l\'enregistrement')
      return
    }
    toast.success(devisId ? 'Devis mis à jour' : 'Devis créé')
    router.push(`/devis/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          {...register('title')}
          className={errors.title ? 'border-destructive' : ''}
          placeholder="Ex: Campagne TikTok - Marque X"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      {projects.length > 0 && (
        <div>
          <Label htmlFor="project_id">Projet *</Label>
          <select
            id="project_id"
            {...register('project_id')}
            className={`flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.project_id ? 'border-destructive' : ''}`}
          >
            <option value="">— Sélectionner un projet —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.reference} — {p.title}
                {p.contact ? ` (${[p.contact.first_name, p.contact.last_name].filter(Boolean).join(' ')})` : ''}
              </option>
            ))}
          </select>
          {errors.project_id && (
            <p className="text-sm text-destructive mt-1">{errors.project_id.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Créez d&apos;abord un contact/organisation et un projet associé.
          </p>
        </div>
      )}
      {projects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">Aucun projet disponible</p>
          <p className="text-amber-700 dark:text-amber-300 mt-1">
            Créez d&apos;abord un contact (ou organisation), puis un projet associé avant de créer un devis.
          </p>
          <a href="/projects/new" className="text-primary underline mt-2 inline-block">Créer un projet</a>
        </div>
      )}
      {contacts.length > 0 && projects.length > 0 && (
        <div>
          <Label htmlFor="contact_id">Contact (optionnel, dérivé du projet)</Label>
          <select
            id="contact_id"
            {...register('contact_id')}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Déduit du projet —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {services.length > 0 && (
        <div>
          <Label>Ajouter une prestation</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addServiceLine(s)}
                className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left max-w-[200px] truncate"
              >
                {s.name} — {s.default_price.toLocaleString('fr-FR')} FCFA
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>Lignes</Label>
        <div className="space-y-3 mt-2">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="flex flex-wrap gap-2 items-end p-3 rounded-lg border border-border bg-muted/20"
            >
              <div className="flex-1 min-w-[200px]">
                <Input
                  {...register(`line_items.${idx}.description`)}
                  placeholder="Description"
                  className={errors.line_items?.[idx]?.description ? 'border-destructive' : ''}
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  {...register(`line_items.${idx}.quantity`)}
                  placeholder="Qté"
                  min={1}
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  {...register(`line_items.${idx}.unit_price`)}
                  placeholder="Prix"
                  min={0}
                />
              </div>
              <div className="w-24">
                <Input {...register(`line_items.${idx}.unit`)} placeholder="unité" />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(idx)}
                >
                  Suppr.
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, unit_price: 0, unit: 'unité', tax_rate: 0 })}>
            + Ligne
          </Button>
        </div>
        {errors.line_items && (
          <p className="text-sm text-destructive mt-1">
            {errors.line_items.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <div>
          <Label htmlFor="tax_rate">TVA (%)</Label>
          <Input
            id="tax_rate"
            type="number"
            {...register('tax_rate')}
            min={0}
            max={100}
            step={0.01}
            className="w-24"
          />
        </div>
        <div>
          <Label htmlFor="valid_until">Valide jusqu&apos;au</Label>
          <Input id="valid_until" type="date" {...register('valid_until')} />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (client)</Label>
        <textarea
          id="notes"
          {...register('notes')}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <div className="rounded-lg border border-border p-4 bg-muted/20">
        <div className="flex justify-between text-sm">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span>TVA ({taxRate}%)</span>
            <span>{taxAmount.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
        <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-border">
          <span>Total</span>
          <span>{total.toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : devisId ? 'Mettre à jour' : 'Créer le devis'}
      </Button>
    </form>
  )
}
