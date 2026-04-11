'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { CashFlowByMonthChart } from '@/components/analytics/CashFlowByMonthChart'

type FinancialSummary = {
  period: { start: string; end: string }
  revenue: number
  treasuryIncome?: number
  expenses: number
  treasuryExpense?: number
  grossProfit: number
  grossMargin: number
  invoicesIssued: number
  invoicesPaid: number
  invoicesUnpaid: number
  invoicesOverdue: number
  revenueByMonth: Array<{ month: string; revenue: number; count: number }>
  expensesByCategory: Array<{ category: string; amount: number; count: number }>
  cashFlow: Array<{ month: string; revenue: number; expenses: number; net: number }>
  topClients: Array<{ contact_id: string; name: string; revenue: number; invoiceCount: number }>
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M FCFA`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k FCFA`
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
  return d.toLocaleDateString('fr-FR', { month: 'short' })
}

function FinancialKpi({
  label,
  value,
  sub,
  color,
  trend,
}: {
  label: string
  value: string
  sub?: string
  color: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  return (
    <div className="crm-card p-5">
      <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">{label}</p>
      <p className="text-2xl font-bold tracking-tight" style={{ color, letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      {trend && (
        <div className="mt-2">
          <TrendIcon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      )}
    </div>
  )
}

export function FinancialReportClient({ initialData }: { initialData: FinancialSummary | null }) {
  if (!initialData) {
    return (
      <div className="crm-card crm-empty py-12">
        <p className="crm-empty-title">Aucune donnée financière</p>
        <p className="text-xs text-muted-foreground">Créez des factures et enregistrez des dépenses pour voir le bilan</p>
      </div>
    )
  }

  const {
    revenue,
    treasuryIncome = 0,
    expenses,
    treasuryExpense = 0,
    grossProfit,
    grossMargin,
    invoicesIssued,
    invoicesPaid,
    invoicesUnpaid,
    invoicesOverdue,
    expensesByCategory,
    cashFlow,
    topClients,
  } = initialData

  const periodLabel =
    initialData.period?.start && initialData.period?.end
      ? `${initialData.period.start} → ${initialData.period.end}`
      : null

  return (
    <div className="space-y-6">
      {periodLabel && (
        <p className="text-xs text-muted-foreground -mt-1">
          Période analysée : <span className="font-medium text-foreground">{periodLabel}</span> — factures
          filtrées par <span className="font-medium">date d&apos;échéance</span> (ou date de création si pas
          d&apos;échéance), encaissements par <span className="font-medium">date de paiement</span> (jour
          calendaire), dépenses projet et{' '}
          <Link href="/treasury" className="text-primary hover:underline">
            mouvements de trésorerie
          </Link>
          . La section « Performance commerciale » utilise les <span className="font-medium">devis / projets /
          factures créés</span> dans la même plage.
        </p>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpi
          label="Revenus (factures)"
          value={formatMoney(revenue)}
          sub={
            treasuryIncome > 0
              ? `+ ${formatMoney(treasuryIncome)} autres revenus (trésorerie)`
              : 'Encaissé sur la période'
          }
          color="oklch(0.42 0.14 145)"
          trend="up"
        />
        <FinancialKpi
          label="Charges"
          value={formatMoney(expenses + treasuryExpense)}
          sub={
            treasuryExpense > 0
              ? `${formatMoney(expenses)} projets · ${formatMoney(treasuryExpense)} trésorerie`
              : 'Dépenses projet'
          }
          color="oklch(0.5 0.18 20)"
          trend={expenses + treasuryExpense > revenue ? 'down' : 'neutral'}
        />
        <FinancialKpi
          label="Marge brute"
          value={formatMoney(grossProfit)}
          sub={`${grossMargin}% de marge`}
          color={grossProfit >= 0 ? 'oklch(0.42 0.16 260)' : 'oklch(0.5 0.18 20)'}
          trend={grossProfit >= 0 ? 'up' : 'down'}
        />
        <FinancialKpi
          label="Trésorerie nette"
          value={formatMoney(grossProfit)}
          sub={`${invoicesPaid}/${invoicesIssued} factures payées`}
          color={grossProfit >= 0 ? 'var(--primary)' : 'oklch(0.5 0.18 20)'}
        />
      </div>

      {/* Invoices summary */}
      <div className="crm-card p-5">
        <h3 className="text-sm font-semibold mb-4">État des factures</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Émises', value: invoicesIssued, color: 'var(--foreground)' },
            { label: 'Payées', value: invoicesPaid, color: 'oklch(0.42 0.14 145)' },
            { label: 'À encaisser', value: invoicesUnpaid, color: 'oklch(0.5 0.2 40)' },
            { label: 'En retard', value: invoicesOverdue, color: invoicesOverdue > 0 ? 'oklch(0.5 0.18 20)' : 'var(--muted-foreground)' },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <CashFlowByMonthChart cashFlow={cashFlow} />

      {/* Bottom row: expenses by category + top clients */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Expenses by category */}
        <div className="crm-card p-5">
          <h3 className="text-sm font-semibold mb-4">Dépenses par catégorie</h3>
          {expensesByCategory.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Aucune dépense enregistrée</p>
          ) : (
            <div className="space-y-3">
              {expensesByCategory.map((cat, i) => {
                const maxAmt = expensesByCategory[0]?.amount ?? 1
                const pct = (cat.amount / maxAmt) * 100
                const hue = 20 + i * 20
                const color = `oklch(0.5 0.18 ${hue})`
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-muted-foreground">{formatMoney(cat.amount)}</span>
                    </div>
                    <div className="crm-progress">
                      <div className="crm-progress-bar" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top clients */}
        <div className="crm-card p-5">
          <h3 className="text-sm font-semibold mb-4">Meilleurs clients</h3>
          {topClients.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Aucun client avec facturation</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, i) => {
                const maxRev = topClients[0]?.revenue ?? 1
                const pct = (client.revenue / maxRev) * 100
                return (
                  <div key={client.contact_id} className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 text-xs font-bold text-white"
                      style={{ background: 'var(--gradient-primary)', opacity: 1 - i * 0.15 }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold truncate">{client.name}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">{formatMoney(client.revenue)}</span>
                      </div>
                      <div className="crm-progress">
                        <div className="crm-progress-bar" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
