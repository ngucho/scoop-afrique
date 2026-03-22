'use client'

import { useMemo, useState } from 'react'

type ReportSummary = {
  revenueByMonth: Array<{
    month: string
    revenue: number
    treasuryIncome?: number
    totalCashIn?: number
    count: number
  }>
  devisByStatus: Array<{ status: string; count: number; total: number }>
  pipelineFunnel: { draft: number; sent: number; accepted: number; rejected: number; expired: number }
  conversionRates: {
    devisSentToAccepted: number
    devisAcceptedToProject: number
    invoiceSentToPaid: number
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--muted-foreground)',
  sent: 'oklch(0.42 0.16 260)',
  accepted: 'oklch(0.42 0.14 145)',
  rejected: 'oklch(0.5 0.18 20)',
  expired: 'oklch(0.5 0.2 40)',
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M FCFA`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k FCFA`
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
  return d.toLocaleDateString('fr-FR', { month: 'short' })
}

function RateCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="crm-card p-5">
      <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">{label}</p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold tracking-tight" style={{ color }}>{value}%</span>
      </div>
      <div className="crm-progress">
        <div className="crm-progress-bar" style={{ width: `${Math.min(value, 100)}%`, background: `${color}` }} />
      </div>
    </div>
  )
}

export function ReportsClient({ initialData }: { initialData: ReportSummary | null }) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  const maxRevenue = useMemo(() => {
    if (!initialData?.revenueByMonth?.length) return 1
    return Math.max(
      ...initialData.revenueByMonth.map((r) => {
        const t = Number(r.treasuryIncome) || 0
        const total = r.totalCashIn != null ? Number(r.totalCashIn) : Number(r.revenue) + t
        return total
      }),
      1
    )
  }, [initialData])

  const maxDevisCount = useMemo(() => {
    if (!initialData?.devisByStatus?.length) return 1
    return Math.max(...initialData.devisByStatus.map((d) => d.count), 1)
  }, [initialData])

  if (!initialData) {
    return (
      <div className="crm-card crm-empty py-16">
        <p className="crm-empty-title">Données non disponibles</p>
        <p className="text-sm text-muted-foreground">Impossible de charger les rapports</p>
      </div>
    )
  }

  const { revenueByMonth, devisByStatus, pipelineFunnel, conversionRates } = initialData

  const totalRevenue = revenueByMonth.reduce((sum, r) => {
    const t = Number(r.treasuryIncome) || 0
    const inc = r.totalCashIn != null ? Number(r.totalCashIn) : Number(r.revenue) + t
    return sum + inc
  }, 0)
  const totalDevis = devisByStatus.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="space-y-8 crm-fade-in">

      {/* Conversion rates */}
      <div>
        <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-4">
          Taux de conversion
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <RateCard
            label="Devis envoyé → Accepté"
            value={conversionRates.devisSentToAccepted}
            color="oklch(0.42 0.14 145)"
          />
          <RateCard
            label="Devis accepté → Projet"
            value={conversionRates.devisAcceptedToProject}
            color="oklch(0.42 0.16 260)"
          />
          <RateCard
            label="Facture envoyée → Payée"
            value={conversionRates.invoiceSentToPaid}
            color="oklch(0.5 0.2 40)"
          />
        </div>
      </div>

      {/* Revenue chart */}
      <div className="crm-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold">Entrées encaissées</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Factures payées / partielles + revenus{' '}
              <span className="font-medium text-foreground/80">hors facture</span> (trésorerie)
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'oklch(0.42 0.14 145)' }}>
              {formatMoney(totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">Total période</p>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-44">
          {revenueByMonth.map((r) => {
            const treas = Number(r.treasuryIncome) || 0
            const inv = Number(r.revenue) || 0
            const total = r.totalCashIn != null ? Number(r.totalCashIn) : inv + treas
            const pct = Math.max((total / maxRevenue) * 100, total > 0 ? 2 : 0)
            const isHovered = hoveredBar === r.month
            return (
              <div
                key={r.month}
                className="flex-1 flex flex-col items-center gap-1 group relative"
                onMouseEnter={() => setHoveredBar(r.month)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {isHovered && total > 0 && (
                  <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
                    style={{ background: 'var(--foreground)' }}
                  >
                    Total {formatMoney(total)}
                    <br />
                    <span className="opacity-70">
                      Factures {formatMoney(inv)}
                      {treas > 0 ? ` · Trésor. ${formatMoney(treas)}` : ''}
                    </span>
                    <br />
                    <span className="opacity-70">
                      {r.count} paiement{r.count !== 1 ? 's' : ''} (factures)
                    </span>
                  </div>
                )}
                <div
                  className="w-full rounded-t transition-all duration-200"
                  style={{
                    height: `${pct}%`,
                    minHeight: total > 0 ? '4px' : '2px',
                    background: isHovered
                      ? 'var(--primary)'
                      : total > 0
                        ? 'oklch(0.52 0.22 25 / 0.7)'
                        : 'var(--muted)',
                  }}
                />
                <span className="text-[9px] text-muted-foreground mt-1 font-medium">
                  {formatMonth(r.month)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Devis + Pipeline row */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Devis by status */}
        <div className="crm-card p-6">
          <div className="flex items-start justify-between mb-5">
            <h2 className="text-sm font-semibold">Devis par statut</h2>
            <span className="text-xs text-muted-foreground">{totalDevis} total</span>
          </div>
          <div className="space-y-3">
            {devisByStatus.map((d) => {
              const pct = maxDevisCount > 0 ? (d.count / maxDevisCount) * 100 : 0
              const color = STATUS_COLORS[d.status] ?? 'var(--primary)'
              return (
                <div key={d.status}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium">{STATUS_LABELS[d.status] ?? d.status}</span>
                    <span className="text-muted-foreground">
                      {d.count} · {formatMoney(d.total)}
                    </span>
                  </div>
                  <div className="crm-progress">
                    <div
                      className="crm-progress-bar"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pipeline funnel */}
        <div className="crm-card p-6">
          <h2 className="text-sm font-semibold mb-5">Pipeline commercial</h2>
          <div className="space-y-3">
            {[
              { label: 'Brouillons', value: pipelineFunnel.draft, color: 'var(--muted-foreground)' },
              { label: 'Envoyés', value: pipelineFunnel.sent, color: 'oklch(0.42 0.16 260)' },
              { label: 'Acceptés', value: pipelineFunnel.accepted, color: 'oklch(0.42 0.14 145)' },
              { label: 'Refusés', value: pipelineFunnel.rejected, color: 'oklch(0.5 0.18 20)' },
              { label: 'Expirés', value: pipelineFunnel.expired, color: 'oklch(0.5 0.2 40)' },
            ].map((stage) => {
              const total = pipelineFunnel.draft + pipelineFunnel.sent + pipelineFunnel.accepted + pipelineFunnel.rejected + pipelineFunnel.expired
              const pct = total > 0 ? (stage.value / total) * 100 : 0
              return (
                <div key={stage.label} className="flex items-center gap-4">
                  <span className="text-xs font-medium w-24 shrink-0">{stage.label}</span>
                  <div className="flex-1 crm-progress">
                    <div className="crm-progress-bar" style={{ width: `${pct}%`, background: stage.color }} />
                  </div>
                  <span className="text-sm font-bold w-6 text-right" style={{ color: stage.color }}>
                    {stage.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
