'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Label } from 'scoop'
import { FileText, Receipt, ExternalLink } from 'lucide-react'

interface ProjectFinanceClientProps {
  projectId: string
  project: Record<string, unknown>
  devis: Record<string, unknown> | null
  invoices: Array<Record<string, unknown> & { payments?: Array<Record<string, unknown>> }>
  expenses: Array<Record<string, unknown>>
}

export function ProjectFinanceClient({
  projectId,
  project,
  devis,
  invoices,
  expenses,
}: ProjectFinanceClientProps) {
  const router = useRouter()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))

  async function addExpense() {
    const amount = parseInt(expenseAmount, 10)
    if (!expenseTitle.trim() || isNaN(amount) || amount <= 0) return
    const res = await fetch(`/api/crm/projects/${projectId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: expenseTitle.trim(),
        amount,
        category: expenseCategory || undefined,
        incurred_at: expenseDate || new Date().toISOString().slice(0, 10),
      }),
      credentials: 'include',
    })
    if (!res.ok) {
      const json = await res.json()
      alert(json.error ?? 'Erreur')
      return
    }
    setExpenseTitle('')
    setExpenseAmount('')
    setExpenseCategory('')
    setShowExpenseForm(false)
    router.refresh()
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + ((e.amount as number) ?? 0), 0)
  const totalInvoiced = invoices.reduce((sum, i) => sum + ((i.total as number) ?? 0), 0)
  const totalPaid = invoices.reduce((sum, i) => {
    const payments = (i.payments ?? []) as Array<Record<string, unknown>>
    return sum + payments.reduce((s, p) => s + ((p.amount as number) ?? 0), 0)
  }, 0)
  const budgetAgreed = (project.budget_agreed as number) ?? 0

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {budgetAgreed > 0 && (
          <div className="crm-card p-4">
            <p className="text-xs text-muted-foreground">Budget convenu</p>
            <p className="text-lg font-semibold">{budgetAgreed.toLocaleString('fr-FR')} FCFA</p>
          </div>
        )}
        <div className="crm-card p-4">
          <p className="text-xs text-muted-foreground">Facturé</p>
          <p className="text-lg font-semibold">{totalInvoiced.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-muted-foreground">Encaissé</p>
          <p className="text-lg font-semibold text-[var(--state-success)]">{totalPaid.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-muted-foreground">Dépenses</p>
          <p className="text-lg font-semibold">{totalExpenses.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      {/* Devis — from project folder */}
      {devis && (
        <section className="crm-card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
            Devis
          </h2>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <Link href={`/devis/${devis.id}`} className="font-medium hover:underline">
                {String(devis.reference ?? '—')} — {String(devis.title ?? '')}
              </Link>
              <p className="text-sm text-muted-foreground mt-0.5">
                {((devis.total as number) ?? 0).toLocaleString('fr-FR')} {String(devis.currency ?? 'FCFA')}
                {devis.status ? ` • ${String(devis.status)}` : ''}
              </p>
            </div>
            {devis.pdf_url && (
              <a
                href={devis.pdf_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="crm-quick-action text-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" /> PDF
              </a>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-3">Factures</h2>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune facture liée à ce projet.
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Référence</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-left p-3">Reçus</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => {
                  const payments = (i.payments ?? []) as Array<Record<string, unknown>>
                  return (
                    <tr key={i.id as string} className="border-t border-border">
                      <td className="p-3">
                        <Link href={`/invoices/${i.id}`} className="font-medium hover:underline">
                          {String(i.reference ?? '—')}
                        </Link>
                      </td>
                      <td className="p-3 capitalize">{String(i.status ?? '—')}</td>
                      <td className="p-3 text-right">
                        {((i.total as number) ?? 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="p-3">
                        {payments.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {payments.map((p) => (
                              <span key={p.id as string} className="flex items-center gap-1">
                                {p.receipt_pdf_url ? (
                                  <a
                                    href={p.receipt_pdf_url as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    <Receipt className="h-3 w-3" />
                                    {((p.amount as number) ?? 0).toLocaleString('fr-FR')} FCFA
                                  </a>
                                ) : (
                                  <span className="text-xs">
                                    {((p.amount as number) ?? 0).toLocaleString('fr-FR')} FCFA
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="crm-card p-5">
        <h2 className="text-sm font-semibold mb-4">Dépenses</h2>
        {showExpenseForm ? (
          <div className="rounded-lg border border-border p-4 space-y-3 max-w-md bg-muted/20">
            <div>
              <Label>Titre</Label>
              <Input
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="Ex: Transport"
              />
            </div>
            <div>
              <Label>Montant (FCFA)</Label>
              <Input
                type="number"
                min={0}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Input
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                placeholder="transport, matériel, sous-traitance..."
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addExpense}>Ajouter</Button>
              <Button variant="outline" onClick={() => setShowExpenseForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowExpenseForm(true)}>
            + Dépense
          </Button>
        )}

        {expenses.length > 0 && (
          <div className="mt-4 rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Titre</th>
                  <th className="text-left p-3">Catégorie</th>
                  <th className="text-right p-3">Montant</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id as string} className="border-t border-border">
                    <td className="p-3">{String(e.title ?? '—')}</td>
                    <td className="p-3">{String(e.category ?? '—')}</td>
                    <td className="p-3 text-right">
                      {((e.amount as number) ?? 0).toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-border font-medium text-right">
              Total: {totalExpenses.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
