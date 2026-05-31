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
  // Additional pipeline data (may not be present in older API)
  pipelineAmount?: number
  pipelineCount?: number
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
    pipelineAmount = 0,
    pipelineCount = 0,
  } = initialData

  const totalRevenue = revenue + treasuryIncome
  const totalExpenses = expenses + treasuryExpense
  const netCashPosition = totalRevenue - totalExpenses
  const unpaidAmount = invoicesUnpaid > 0 ? (revenue / Math.max(invoicesPaid, 1)) * invoicesUnpaid : 0
  const collectionRate = invoicesIssued > 0 ? Math.round((invoicesPaid / invoicesIssued) * 100) : 0

  const periodLabel =
    initialData.period?.start && initialData.period?.end
      ? `${initialData.period.start} → ${initialData.period.end}`
      : null

  return (
    <div className="space-y-6">

      {/* P&L Summary — investor-ready */}
      <div className="crm-card overflow-hidden">
        <div className="border-b border-border px-5 py-3 bg-muted/30">
          <h3 className="text-sm font-semibold">Compte de résultat simplifié</h3>
          {periodLabel && <p className="text-xs text-muted-foreground">Période : {periodLabel}</p>}
        </div>
        <div className="p-5 space-y-0">
          {[
            {
              label: '+ Encaissements factures',
              value: revenue,
              indent: false,
              bold: false,
              color: 'oklch(0.42 0.14 145)',
            },
            {
              label: '+ Autres revenus (trésorerie)',
              value: treasuryIncome,
              indent: true,
              bold: false,
              color: 'oklch(0.42 0.14 145)',
            },
            {
              label: '= Chiffre d\'affaires total',
              value: totalRevenue,
              indent: false,
              bold: true,
              separator: true,
              color: 'oklch(0.42 0.14 145)',
            },
            {
              label: '- Charges projets',
              value: -expenses,
              indent: false,
              bold: false,
              color: 'oklch(0.5 0.18 20)',
            },
            {
              label: '- Autres charges (trésorerie)',
              value: -treasuryExpense,
              indent: true,
              bold: false,
              color: 'oklch(0.5 0.18 20)',
            },
            {
              label: '= Résultat brut d\'exploitation',
              value: grossProfit,
              indent: false,
              bold: true,
              separator: true,
              color: grossProfit >= 0 ? 'oklch(0.42 0.16 260)' : 'oklch(0.5 0.18 20)',
            },
          ].map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-2 text-sm ${row.separator ? 'border-t border-border mt-1 pt-3 font-semibold' : ''} ${row.indent ? 'pl-4 text-muted-foreground text-xs' : ''}`}
            >
              <span>{row.label}</span>
              <span
                className="tabular-nums font-medium"
                style={{ color: row.bold ? row.color : undefined }}
              >
                {row.value === 0 && row.indent ? '—' : (row.value >= 0 ? '' : '−') + formatMoney(Math.abs(row.value))}
              </span>
            </div>
          ))}
          {/* Margin */}
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Marge brute</span>
            <span
              className="font-semibold text-sm"
              style={{ color: grossMargin >= 0 ? 'oklch(0.42 0.16 260)' : 'oklch(0.5 0.18 20)' }}
            >
              {grossMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* 3 key ratios + pipeline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="crm-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trésorerie nette</p>
          <p className="text-xl font-bold tabular-nums" style={{ color: netCashPosition >= 0 ? 'oklch(0.42 0.14 145)' : 'oklch(0.5 0.18 20)' }}>
            {formatMoney(netCashPosition)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Revenus − Charges</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Taux recouvrement</p>
          <p className="text-xl font-bold tabular-nums" style={{ color: collectionRate >= 80 ? 'oklch(0.42 0.14 145)' : 'oklch(0.5 0.2 40)' }}>
            {collectionRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">{invoicesPaid}/{invoicesIssued} factures payées</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Créances à encaisser</p>
          <p className="text-xl font-bold tabular-nums" style={{ color: invoicesUnpaid > 0 ? 'oklch(0.5 0.2 40)' : 'var(--muted-foreground)' }}>
            {invoicesUnpaid > 0 ? formatMoney(unpaidAmount) : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{invoicesOverdue > 0 ? `${invoicesOverdue} en retard` : 'Aucun retard'}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pipeline commercial</p>
          <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
            {pipelineAmount > 0 ? formatMoney(pipelineAmount) : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{pipelineCount > 0 ? `${pipelineCount} devis en cours` : 'Aucun devis actif'}</p>
        </div>
      </div>

      {periodLabel && (
        <div className="-mt-1 space-y-2 text-xs text-muted-foreground">
          <p>
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
          <p className="rounded-lg border border-border bg-muted/30 p-3 text-foreground/90">
            <span className="font-medium">Pourquoi un écart avec la page Factures ?</span> Ici, « encaissements
            factures » = somme des <span className="font-medium">paiements</span> dont la date tombe dans la
            période (flux). La page Factures affiche le total encaissé sur les factures <span className="font-medium">au
            statut « Payée »</span> (cumul toutes périodes, toutes factures). Les entrées hors facture
            (investissement, monétisation, etc.) sont dans « autres revenus (trésorerie) » et sur l&apos;écran{' '}
            <Link href="/treasury" className="text-primary hover:underline">
              Trésorerie
            </Link>
            .
          </p>
        </div>
      )}

      {/* KPIs — encaissements détaillés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpi
          label="Encaissements factures (période)"
          value={formatMoney(revenue)}
          sub={
            treasuryIncome > 0
              ? `+ ${formatMoney(treasuryIncome)} autres revenus (trésorerie)`
              : 'Somme des paiements (dates de paiement dans la plage)'
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
