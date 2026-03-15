'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, Input, Label } from 'scoop'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'check', label: 'Chèque' },
  { value: 'other', label: 'Autre' },
] as const

const schema = z.object({
  amount: z.coerce.number().int().positive('Montant > 0'),
  method: z.enum(['cash', 'bank_transfer', 'mobile_money', 'wave', 'orange_money', 'check', 'other']).optional().default('other'),
  reference: z.string().optional(),
  paid_at: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function PaymentForm({
  invoiceId,
  onSuccess,
}: {
  invoiceId: string
  onSuccess: () => void
}) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: 'cash' },
  })

  const selectedMethod = watch('method') ?? 'cash'
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === selectedMethod)?.label ?? selectedMethod

  async function onSubmit(data: FormData) {
    const res = await fetch(`/api/crm/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        paid_at: data.paid_at || new Date().toISOString().slice(0, 10),
      }),
      credentials: 'include',
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erreur')
      return
    }
    toast.success('Paiement enregistré')
    onSuccess()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-border p-4 max-w-md space-y-3">
      <h3 className="font-medium">Enregistrer un paiement</h3>
      <div>
        <Label htmlFor="amount">Montant (FCFA)</Label>
        <Input
          id="amount"
          type="number"
          min={1}
          {...register('amount')}
          className={errors.amount ? 'border-destructive' : ''}
        />
        {errors.amount && (
          <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="method">Méthode de paiement</Label>
        <select
          id="method"
          {...register('method')}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1.5">
          Méthode choisie : <span className="font-medium text-foreground">{methodLabel}</span>
        </p>
      </div>
      <div>
        <Label htmlFor="reference">Référence transaction</Label>
        <Input id="reference" {...register('reference')} />
      </div>
      <div>
        <Label htmlFor="paid_at">Date</Label>
        <Input id="paid_at" type="date" {...register('paid_at')} />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...register('notes')} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  )
}
