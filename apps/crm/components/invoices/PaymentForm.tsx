'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label } from 'scoop'

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
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: 'other' },
  })

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
      alert(json.error ?? 'Erreur')
      return
    }
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
        <Label htmlFor="method">Méthode</Label>
        <select
          id="method"
          {...register('method')}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="cash">Espèces</option>
          <option value="bank_transfer">Virement</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="wave">Wave</option>
          <option value="orange_money">Orange Money</option>
          <option value="check">Chèque</option>
          <option value="other">Autre</option>
        </select>
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
