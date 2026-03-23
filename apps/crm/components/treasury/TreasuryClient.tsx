'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input, Label } from 'scoop'
import { Pencil, Trash2, Plus } from 'lucide-react'
import {
  CashFlowByMonthChart,
  type CashFlowMonthRow,
} from '@/components/analytics/CashFlowByMonthChart'

const INCOME_CATS = [
  { value: 'monetization', label: 'Monétisation (pub, partenariats)' },
  { value: 'donation', label: 'Dons' },
  { value: 'merch_sale', label: 'Vente merch / produits' },
  { value: 'capital', label: 'Apport en capital' },
  { value: 'services_other', label: 'Autres prestations' },
  { value: 'other_income', label: 'Autre revenu' },
] as const

const EXPENSE_CATS = [
  { value: 'salary', label: 'Salaires' },
  { value: 'rent', label: 'Loyer' },
  { value: 'utilities', label: 'Eau / électricité / charges' },
  { value: 'transport', label: 'Transport' },
  { value: 'purchases', label: 'Achats' },
  { value: 'operating_fees', label: 'Frais de fonctionnement' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other_expense', label: 'Autre dépense' },
] as const

function catLabel(direction: string, category: string): string {
  if (direction === 'income') {
    return INCOME_CATS.find((c) => c.value === category)?.label ?? category
  }
  return EXPENSE_CATS.find((c) => c.value === category)?.label ?? category
}

function formatMoney(n: number) {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

type Movement = Record<string, unknown>

export function TreasuryClient({
  initialMovements,
  initialTotal,
  summary,
  rangeFrom,
  rangeTo,
  projects,
  cashFlow = [],
}: {
  initialMovements: Movement[]
  initialTotal: number
  summary: { income: number; expense: number; from: string; to: string }
  rangeFrom: string
  rangeTo: string
  projects: Array<{ id: string; reference: string; title: string }>
  cashFlow?: CashFlowMonthRow[]
}) {
  const router = useRouter()
  const [periodFrom, setPeriodFrom] = useState(rangeFrom)
  const [periodTo, setPeriodTo] = useState(rangeTo)
  useEffect(() => {
    setPeriodFrom(rangeFrom)
    setPeriodTo(rangeTo)
  }, [rangeFrom, rangeTo])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    direction: 'income' as 'income' | 'expense',
    category: 'monetization',
    amount: '',
    title: '',
    notes: '',
    occurred_at: new Date().toISOString().slice(0, 10),
    project_id: '',
  })

  const categories = useMemo(
    () => (form.direction === 'income' ? INCOME_CATS : EXPENSE_CATS),
    [form.direction]
  )

  function resetForm() {
    setForm({
      direction: 'income',
      category: 'monetization',
      amount: '',
      title: '',
      notes: '',
      occurred_at: new Date().toISOString().slice(0, 10),
      project_id: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  function openEdit(m: Movement) {
    setEditingId(m.id as string)
    setForm({
      direction: (m.direction as 'income' | 'expense') ?? 'income',
      category: String(m.category ?? 'other_income'),
      amount: String(m.amount ?? ''),
      title: String(m.title ?? ''),
      notes: String(m.notes ?? ''),
      occurred_at: m.occurred_at
        ? String(m.occurred_at).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      project_id: (m.project_id as string) ?? '',
    })
    setShowForm(true)
  }

  async function submit() {
    const amount = Math.round(Number(form.amount))
    if (!form.title.trim() || !amount || amount <= 0) {
      toast.error('Titre et montant valides requis')
      return
    }
    setSubmitting(true)
    const body = {
      direction: form.direction,
      category: form.category,
      amount,
      title: form.title.trim(),
      notes: form.notes.trim() || undefined,
      occurred_at: form.occurred_at,
      project_id: form.project_id || undefined,
    }
    const url = editingId ? `/api/crm/treasury/${editingId}` : '/api/crm/treasury'
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const json = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Erreur')
      return
    }
    toast.success(editingId ? 'Mouvement mis à jour' : 'Mouvement enregistré')
    resetForm()
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce mouvement ?')) return
    const res = await fetch(`/api/crm/treasury/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
      return
    }
    toast.success('Supprimé')
    router.refresh()
  }

  const net = summary.income - summary.expense

  function applyDateRange() {
    if (!periodFrom || !periodTo) {
      toast.error('Dates début et fin requises')
      return
    }
    const f = periodFrom <= periodTo ? periodFrom : periodTo
    const t = periodFrom <= periodTo ? periodTo : periodFrom
    const q = new URLSearchParams()
    q.set('from', f)
    q.set('to', t)
    window.location.assign(`/treasury?${q.toString()}`)
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="crm-card p-4 flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Du</Label>
          <Input
            type="date"
            value={periodFrom}
            onChange={(e) => setPeriodFrom(e.target.value)}
            className="mt-1 w-[160px]"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Au</Label>
          <Input
            type="date"
            value={periodTo}
            onChange={(e) => setPeriodTo(e.target.value)}
            className="mt-1 w-[160px]"
          />
        </div>
        <Button type="button" onClick={applyDateRange} className="rounded-full">
          Appliquer la période
        </Button>
        <p className="text-xs text-muted-foreground w-full sm:w-auto sm:ml-2">
          Synthèse et liste des mouvements sont filtrées sur cette plage.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="crm-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Revenus (période)</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatMoney(summary.income)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.from} → {summary.to}
          </p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Dépenses (période)</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400 tabular-nums">
            {formatMoney(summary.expense)}
          </p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Solde (hors factures)</p>
          <p
            className={`text-2xl font-bold tabular-nums ${net >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {formatMoney(net)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Les encaissements factures restent dans Rapports
          </p>
        </div>
      </div>

      <CashFlowByMonthChart
        cashFlow={cashFlow}
        emptyMessage="Aucune donnée sur cette période. Enregistrez des factures, paiements, dépenses projet ou mouvements de trésorerie pour alimenter le graphique."
      />

      <div className="flex flex-wrap gap-2">
        {!showForm ? (
          <Button className="rounded-full" onClick={() => { setShowForm(true); setEditingId(null) }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau mouvement
          </Button>
        ) : (
          <div className="crm-card p-4 w-full max-w-xl space-y-3">
            <h3 className="font-semibold">{editingId ? 'Modifier' : 'Nouveau'} mouvement</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <select
                  value={form.direction}
                  onChange={(e) => {
                    const d = e.target.value as 'income' | 'expense'
                    setForm((f) => ({
                      ...f,
                      direction: d,
                      category: d === 'income' ? 'monetization' : 'salary',
                    }))
                  }}
                  className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="income">Revenu</option>
                  <option value="expense">Dépense</option>
                </select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Titre</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1"
                  placeholder="Libellé comptable"
                />
              </div>
              <div>
                <Label>Montant (FCFA)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.occurred_at}
                  onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))}
                  className="mt-1"
                />
              </div>
              {projects.length > 0 && (
                <div className="sm:col-span-2">
                  <Label>Projet (optionnel)</Label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
                    className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">— Aucun —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.reference} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-1"
                  placeholder="Optionnel"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={submitting}>
                {submitting ? '…' : editingId ? 'Enregistrer' : 'Créer'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="crm-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Mouvements ({initialTotal})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Libellé</th>
                <th className="text-right">Montant</th>
                <th className="text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialMovements.map((m) => {
                const dir = String(m.direction ?? '')
                const amt = Number(m.amount ?? 0)
                return (
                  <tr key={String(m.id)}>
                    <td className="text-sm whitespace-nowrap">
                      {m.occurred_at
                        ? new Date(m.occurred_at as string).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={
                          dir === 'income' ? 'crm-pill crm-pill-accepted' : 'crm-pill crm-pill-partial'
                        }
                      >
                        {dir === 'income' ? 'Revenu' : 'Dépense'}
                      </span>
                    </td>
                    <td className="text-sm">{catLabel(dir, String(m.category ?? ''))}</td>
                    <td className="text-sm max-w-[220px] truncate">{String(m.title ?? '—')}</td>
                    <td
                      className={`text-right font-medium tabular-nums ${dir === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}
                    >
                      {dir === 'expense' ? '−' : '+'}
                      {formatMoney(amt)}
                    </td>
                    <td className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => remove(String(m.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {initialMovements.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">Aucun mouvement enregistré.</p>
        )}
      </div>
    </div>
  )
}
