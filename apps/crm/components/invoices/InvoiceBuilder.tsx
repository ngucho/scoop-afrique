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
  contact_id: z.string().uuid().optional().or(z.literal('')),
  project_id: z.string().min(1, 'Sélectionnez un projet'),
  line_items: z.array(lineItemSchema).min(1, 'Au moins une ligne requise'),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
  discount_amount: z.coerce.number().int().min(0).optional().default(0),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

const createFromProjectSchema = createSchema.omit({ line_items: true }).extend({
  line_items: z.array(lineItemSchema).min(1),
})

const editSchema = createSchema.extend({
  project_id: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof createSchema>

type LineItemInput = {
  description?: string
  quantity?: number
  unit_price?: number
  unit?: string
  tax_rate?: number
}

interface InvoiceBuilderProps {
  invoiceId?: string
  defaultValues?: Partial<FormData>
  contacts?: Array<{ id: string; first_name?: string; last_name?: string }>
  projects?: Array<{ id: string; reference: string; title: string }>
  defaultProjectId?: string
  lineItemsFromProject?: Array<LineItemInput>
}

function normalizeLineItem(item: LineItemInput): { description: string; quantity: number; unit_price: number; unit: string; tax_rate: number } {
  return {
    description: String(item.description ?? ''),
    quantity: Number(item.quantity ?? 1),
    unit_price: Number(item.unit_price ?? 0),
    unit: String(item.unit ?? 'unité'),
    tax_rate: Number(item.tax_rate ?? 0),
  }
}

export function InvoiceBuilder({
  invoiceId,
  defaultValues,
  contacts = [],
  projects = [],
  defaultProjectId,
  lineItemsFromProject,
}: InvoiceBuilderProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialLineItems = lineItemsFromProject?.length
    ? lineItemsFromProject.map(normalizeLineItem)
    : defaultValues?.line_items ?? [{ description: '', quantity: 1, unit_price: 0, unit: 'unité', tax_rate: 0 }]

  const useProjectLineItems = Boolean(lineItemsFromProject?.length)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(
      invoiceId ? editSchema : useProjectLineItems ? createFromProjectSchema : createSchema
    ),
    defaultValues: {
      ...defaultValues,
      project_id: defaultProjectId ?? defaultValues?.project_id ?? '',
      line_items: initialLineItems,
      tax_rate: defaultValues?.tax_rate ?? 0,
      discount_amount: defaultValues?.discount_amount ?? 0,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })
  const lineItems = watch('line_items')
  const taxRate = watch('tax_rate') ?? 0
  const discountAmount = watch('discount_amount') ?? 0

  const subtotal =
    lineItems?.reduce(
      (sum, i) => sum + (i.quantity ?? 0) * (i.unit_price ?? 0),
      0
    ) ?? 0
  const taxable = Math.max(0, subtotal - discountAmount)
  const taxAmount = Math.round(taxable * (taxRate / 100))
  const total = taxable + taxAmount

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    const body = {
      ...data,
      contact_id: data.contact_id || undefined,
      project_id: data.project_id || undefined,
      line_items: data.line_items.map((i) => ({
        ...i,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        // Avoid NaN when tax_rate is missing
        tax_rate: Number(i.tax_rate ?? 0),
      })),
      discount_amount: data.discount_amount ?? 0,
    }
    const url = invoiceId ? `/api/crm/invoices/${invoiceId}` : '/api/crm/invoices'
    const res = await fetch(url, {
      method: invoiceId ? 'PATCH' : 'POST',
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
    toast.success(invoiceId ? 'Facture mise à jour' : 'Facture créée')
    // Ensure the subsequent detail page re-renders with fresh data
    router.refresh()
    router.push(`/invoices/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {defaultProjectId && !lineItemsFromProject?.length && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">Projet sans devis</p>
          <p className="text-amber-700 dark:text-amber-300 mt-1">
            Ce projet n&apos;a pas de devis avec des lignes. Saisissez les lignes manuellement ou créez d&apos;abord un devis pour ce projet.
          </p>
        </div>
      )}
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
      {projects.length > 0 && (
        <div>
          <Label htmlFor="project_id">Projet *</Label>
          <select
            id="project_id"
            {...register('project_id')}
            className={`flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${errors.project_id ? 'border-destructive' : ''}`}
          >
            <option value="">— Sélectionner —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.reference} — {p.title}
              </option>
            ))}
          </select>
          {errors.project_id && (
            <p className="text-sm text-destructive mt-1">{errors.project_id.message}</p>
          )}
        </div>
      )}
      {projects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">Aucun projet disponible</p>
          <p className="text-amber-700 dark:text-amber-300 mt-1">
            Créez d&apos;abord un contact/organisation et un projet avant de créer une facture.
          </p>
          <a href="/projects/new" className="text-primary underline mt-2 inline-block">Créer un projet</a>
        </div>
      )}

      <div>
        <Label>Lignes {useProjectLineItems && '(du devis du projet)'}</Label>
        {useProjectLineItems ? (
          <div className="mt-2 rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Description</th>
                  <th className="text-right p-3">Qté</th>
                  <th className="text-right p-3">Prix unit.</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => {
                  const qty = Number(item.quantity ?? 1)
                  const price = Number(item.unit_price ?? 0)
                  return (
                    <tr key={i} className="border-t border-border">
                      <td className="p-3">{String(item.description ?? '—')}</td>
                      <td className="text-right p-3">{qty}</td>
                      <td className="text-right p-3">
                        {price.toLocaleString('fr-FR')} {String(item.unit ?? '')}
                      </td>
                      <td className="text-right p-3">
                        {(qty * price).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
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
        )}
        {errors.line_items && !useProjectLineItems && (
          <p className="text-sm text-destructive mt-1">
            {errors.line_items.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
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
          <Label htmlFor="discount_amount">Réduction (FCFA)</Label>
          <Input
            id="discount_amount"
            type="number"
            {...register('discount_amount')}
            min={0}
            className="w-28"
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="due_date">Échéance</Label>
          <Input id="due_date" type="date" {...register('due_date')} />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (sur facture)</Label>
        <Textarea id="notes" {...register('notes')} rows={2} placeholder="Notes visibles sur la facture..." />
      </div>
      <div>
        <Label htmlFor="internal_notes">Notes internes</Label>
        <Textarea id="internal_notes" {...register('internal_notes')} rows={2} placeholder="Notes internes uniquement..." />
      </div>

      <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-1">
        <div className="flex justify-between text-sm">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Réduction</span>
            <span>-{discountAmount.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
        {taxRate > 0 && (
          <div className="flex justify-between text-sm">
            <span>TVA ({taxRate}%)</span>
            <span>{taxAmount.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
        <div className="flex justify-between font-semibold pt-2 border-t border-border">
          <span>Total</span>
          <span>{total.toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : invoiceId ? 'Mettre à jour' : 'Créer la facture'}
      </Button>
    </form>
  )
}
