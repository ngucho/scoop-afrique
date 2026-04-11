'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Dialog, Input } from 'scoop'
import { Pencil } from 'lucide-react'
import { PaymentForm } from './PaymentForm'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'check', label: 'Chèque' },
  { value: 'other', label: 'Autre' },
] as const

export function InvoicePaymentsSection({
  invoiceId,
  payments,
  balance,
}: {
  invoiceId: string
  payments: Array<Record<string, unknown>>
  balance: number
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingId) return
    const fd = new FormData(e.currentTarget)
    const amount = Math.round(Number(fd.get('amount')))
    if (!amount || amount < 1) {
      toast.error('Montant invalide')
      return
    }
    setSaving(true)
    const body = {
      amount,
      method: fd.get('method') as string,
      reference: (fd.get('reference') as string) || undefined,
      paid_at: (fd.get('paid_at') as string) || undefined,
      notes: (fd.get('notes') as string) || undefined,
    }
    const res = await fetch(`/api/crm/invoices/${invoiceId}/payments/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Erreur')
      return
    }
    toast.success('Paiement mis à jour')
    setEditingId(null)
    router.refresh()
  }

  return (
    <section>
      <h2 className="font-semibold mb-3">Paiements</h2>
      {payments.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Méthode</th>
                <th className="text-right p-3">Montant</th>
                <th className="text-left p-3">Reçu</th>
                <th className="text-right p-3 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const id = String(p.id)
                const isEdit = editingId === id
                if (isEdit) {
                  return (
                    <tr key={id} className="border-t border-border bg-muted/20">
                      <td colSpan={5} className="p-4">
                        <form onSubmit={saveEdit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl">
                          <div>
                            <label className="text-xs text-muted-foreground">Date de paiement</label>
                            <Input
                              name="paid_at"
                              type="date"
                              required
                              defaultValue={
                                p.paid_at
                                  ? new Date(p.paid_at as string).toISOString().slice(0, 10)
                                  : ''
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Méthode</label>
                            <select
                              name="method"
                              defaultValue={String(p.method ?? 'other')}
                              className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m.value} value={m.value}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Montant (FCFA)</label>
                            <Input
                              name="amount"
                              type="number"
                              min={1}
                              required
                              defaultValue={String((p.amount as number) ?? 0)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Référence</label>
                            <Input
                              name="reference"
                              defaultValue={String(p.reference ?? '')}
                              className="mt-1"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-muted-foreground">Notes</label>
                            <Input name="notes" defaultValue={String(p.notes ?? '')} className="mt-1" />
                          </div>
                          <div className="flex gap-2 items-end sm:col-span-2">
                            <Button type="submit" disabled={saving}>
                              {saving ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                              Annuler
                            </Button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={id} className="border-t border-border">
                    <td className="p-3">
                      {p.paid_at
                        ? new Date(p.paid_at as string).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="p-3 capitalize">{String(p.method ?? '—').replace('_', ' ')}</td>
                    <td className="p-3 text-right">
                      {((p.amount as number) ?? 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3">
                      <a
                        href={`/api/crm/payments/${p.id}/receipt/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        PDF
                      </a>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => setEditingId(id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {balance > 0 && (
        <>
          <Button type="button" className="mt-2 rounded-full" onClick={() => setPaymentOpen(true)}>
            Enregistrer un paiement
          </Button>
          <Dialog
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            title="Enregistrer un paiement"
            className="max-w-lg"
          >
            <PaymentForm
              invoiceId={invoiceId}
              variant="plain"
              onSuccess={() => setPaymentOpen(false)}
            />
          </Dialog>
        </>
      )}
    </section>
  )
}
