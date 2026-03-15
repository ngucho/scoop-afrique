'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Label } from 'scoop'

interface ProjectFinanceClientProps {
  projectId: string
  invoices: Array<Record<string, unknown>>
  expenses: Array<Record<string, unknown>>
}

export function ProjectFinanceClient({
  projectId,
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

  return (
    <div className="space-y-8">
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
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Dépenses</h2>
        {showExpenseForm ? (
          <div className="rounded-lg border border-border p-4 space-y-3 max-w-md">
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
          <Button onClick={() => setShowExpenseForm(true)}>+ Dépense</Button>
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
