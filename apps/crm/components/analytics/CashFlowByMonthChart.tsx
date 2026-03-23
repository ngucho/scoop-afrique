'use client'

import { useMemo, useState } from 'react'

export type CashFlowMonthRow = {
  month: string
  revenue: number
  expenses: number
  net: number
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M FCFA`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k FCFA`
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

type ViewMode = 'all' | 'revenue' | 'expenses'

export function CashFlowByMonthChart({
  cashFlow,
  title = 'Flux de trésorerie',
  subtitle = 'Par mois : encaissements factures + entrées trésorerie vs dépenses projet + sorties trésorerie',
  emptyMessage = 'Aucune donnée sur cette période (tous les montants sont à zéro).',
}: {
  cashFlow: CashFlowMonthRow[]
  title?: string
  subtitle?: string
  emptyMessage?: string
}) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null)
  const [cashFlowView, setCashFlowView] = useState<ViewMode>('all')

  const maxCashFlow = useMemo(() => {
    if (!cashFlow.length) return 1
    return Math.max(...cashFlow.flatMap((cf) => [cf.revenue, cf.expenses]), 1)
  }, [cashFlow])

  const hasAnyMovement = useMemo(
    () => cashFlow.some((cf) => cf.revenue > 0 || cf.expenses > 0),
    [cashFlow]
  )

  if (cashFlow.length === 0) {
    return (
      <div className="crm-card p-6">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        <p className="text-sm text-muted-foreground py-12 text-center">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="crm-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--muted)' }}>
          {(['all', 'revenue', 'expenses'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setCashFlowView(v)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={
                cashFlowView === v
                  ? { background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              {v === 'all' ? 'Tout' : v === 'revenue' ? 'Revenus' : 'Dépenses'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {cashFlowView !== 'expenses' && (
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'oklch(0.42 0.14 145)' }} />
            <span className="text-xs text-muted-foreground">Entrées</span>
          </div>
        )}
        {cashFlowView !== 'revenue' && (
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'oklch(0.5 0.18 20)' }} />
            <span className="text-xs text-muted-foreground">Sorties</span>
          </div>
        )}
      </div>

      {!hasAnyMovement && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mb-3 rounded-md bg-amber-500/10 px-3 py-2">
          {emptyMessage}
        </p>
      )}

      {/* Hauteur fixe + zone de barres en position absolue : les % de hauteur ont un parent dimensionné */}
      <div className="flex h-[200px] gap-1.5 sm:gap-2">
        {cashFlow.map((cf) => {
          const isHovered = hoveredMonth === cf.month
          const revPct = maxCashFlow > 0 ? (cf.revenue / maxCashFlow) * 100 : 0
          const expPct = maxCashFlow > 0 ? (cf.expenses / maxCashFlow) * 100 : 0
          const revH = Math.max(revPct, cf.revenue > 0 ? 3 : 0)
          const expH = Math.max(expPct, cf.expenses > 0 ? 3 : 0)

          return (
            <div
              key={cf.month}
              className="flex min-w-0 flex-1 flex-col gap-1"
              onMouseEnter={() => setHoveredMonth(cf.month)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <div className="relative min-h-0 flex-1">
                {isHovered && (
                  <div
                    className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl px-3 py-2 text-xs shadow-xl"
                    style={{ background: 'var(--popover)', border: '1px solid var(--border)' }}
                  >
                    <p className="mb-0.5 font-semibold text-foreground">{formatMonthLabel(cf.month)}</p>
                    {cashFlowView !== 'expenses' && (
                      <p style={{ color: 'oklch(0.42 0.14 145)' }}>↑ {formatMoney(cf.revenue)}</p>
                    )}
                    {cashFlowView !== 'revenue' && (
                      <p style={{ color: 'oklch(0.5 0.18 20)' }}>↓ {formatMoney(cf.expenses)}</p>
                    )}
                    <p
                      className="mt-0.5 font-semibold"
                      style={{ color: cf.net >= 0 ? 'oklch(0.42 0.14 145)' : 'oklch(0.5 0.18 20)' }}
                    >
                      Net : {formatMoney(cf.net)}
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 flex items-end justify-center gap-0.5 px-0.5">
                  {cashFlowView !== 'expenses' && (
                    <div
                      className="max-w-[48%] min-w-[6px] flex-1 rounded-t transition-all duration-200"
                      style={{
                        height: `${revH}%`,
                        background: isHovered ? 'oklch(0.42 0.14 145)' : 'oklch(0.42 0.14 145 / 0.75)',
                      }}
                    />
                  )}
                  {cashFlowView !== 'revenue' && (
                    <div
                      className="max-w-[48%] min-w-[6px] flex-1 rounded-t transition-all duration-200"
                      style={{
                        height: `${expH}%`,
                        background: isHovered ? 'oklch(0.5 0.18 20)' : 'oklch(0.5 0.18 20 / 0.65)',
                      }}
                    />
                  )}
                </div>
              </div>
              <span className="shrink-0 text-center text-[9px] font-medium text-muted-foreground truncate">
                {formatMonthLabel(cf.month)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
