'use client'

import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type FinancialSummary = {
  period: { start: string; end: string }
  revenue: number
  expenses: number
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
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null)
  const [cashFlowView, setCashFlowView] = useState<'all' | 'revenue' | 'expenses'>('all')

  const maxCashFlow = useMemo(() => {
    if (!initialData?.cashFlow?.length) return 1
    return Math.max(
      ...initialData.cashFlow.flatMap((cf) => [cf.revenue, cf.expenses]),
      1
    )
  }, [initialData])

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
    expenses,
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

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpi
          label="Chiffre d'affaires"
          value={formatMoney(revenue)}
          sub="Encaissé sur la période"
          color="oklch(0.42 0.14 145)"
          trend="up"
        />
        <FinancialKpi
          label="Dépenses"
          value={formatMoney(expenses)}
          sub="Total charges"
          color="oklch(0.5 0.18 20)"
          trend={expenses > revenue ? 'down' : 'neutral'}
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

      {/* Cash Flow chart */}
      <div className="crm-card p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold">Flux de trésorerie</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Revenus vs Dépenses par mois</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--muted)' }}>
            {(['all', 'revenue', 'expenses'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setCashFlowView(v)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={cashFlowView === v ? { background: 'var(--card)', boxShadow: 'var(--shadow-sm)' } : { color: 'var(--muted-foreground)' }}
              >
                {v === 'all' ? 'Tout' : v === 'revenue' ? 'Revenus' : 'Dépenses'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          {cashFlowView !== 'expenses' && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'oklch(0.42 0.14 145)' }} />
              <span className="text-xs text-muted-foreground">Revenus</span>
            </div>
          )}
          {cashFlowView !== 'revenue' && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'oklch(0.5 0.18 20)' }} />
              <span className="text-xs text-muted-foreground">Dépenses</span>
            </div>
          )}
        </div>

        <div className="flex items-end gap-1.5 h-48 relative">
          {cashFlow.map((cf) => {
            const isHovered = hoveredMonth === cf.month
            const revPct = (cf.revenue / maxCashFlow) * 100
            const expPct = (cf.expenses / maxCashFlow) * 100

            return (
              <div
                key={cf.month}
                className="flex-1 flex flex-col items-center gap-1 relative group"
                onMouseEnter={() => setHoveredMonth(cf.month)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {isHovered && (
                  <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 rounded-xl px-3 py-2 text-xs shadow-xl whitespace-nowrap"
                    style={{ background: 'var(--popover)', border: '1px solid var(--border)' }}
                  >
                    <p className="font-semibold text-foreground mb-0.5">{formatMonthLabel(cf.month)}</p>
                    {cashFlowView !== 'expenses' && (
                      <p style={{ color: 'oklch(0.42 0.14 145)' }}>↑ {formatMoney(cf.revenue)}</p>
                    )}
                    {cashFlowView !== 'revenue' && (
                      <p style={{ color: 'oklch(0.5 0.18 20)' }}>↓ {formatMoney(cf.expenses)}</p>
                    )}
                    <p className="font-semibold mt-0.5" style={{ color: cf.net >= 0 ? 'oklch(0.42 0.14 145)' : 'oklch(0.5 0.18 20)' }}>
                      Net: {formatMoney(cf.net)}
                    </p>
                  </div>
                )}

                <div className="w-full h-full flex items-end justify-center gap-0.5">
                  {cashFlowView !== 'expenses' && (
                    <div
                      className="flex-1 rounded-t transition-all duration-200"
                      style={{
                        height: `${Math.max(revPct, cf.revenue > 0 ? 2 : 0)}%`,
                        background: isHovered ? 'oklch(0.42 0.14 145)' : 'oklch(0.42 0.14 145 / 0.7)',
                      }}
                    />
                  )}
                  {cashFlowView !== 'revenue' && (
                    <div
                      className="flex-1 rounded-t transition-all duration-200"
                      style={{
                        height: `${Math.max(expPct, cf.expenses > 0 ? 2 : 0)}%`,
                        background: isHovered ? 'oklch(0.5 0.18 20)' : 'oklch(0.5 0.18 20 / 0.6)',
                      }}
                    />
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">
                  {formatMonthLabel(cf.month)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

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
