import Link from 'next/link'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { CrmDateRangeBar } from '@/components/analytics/CrmDateRangeBar'
import {
  FileText,
  Users,
  ClipboardList,
  Receipt,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Inbox,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export const dynamic = 'force-dynamic'

function rawDate(sp: Record<string, string | string[] | undefined>, k: string): string | undefined {
  const v = sp[k]
  const s = Array.isArray(v) ? v[0] : v
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  return s
}

async function getDashboardData(from?: string, to?: string) {
  try {
    const { getAccessToken } = await import('@/lib/auth0')
    const token = await getAccessToken()
    if (!token?.accessToken) return null

    const dashQs = new URLSearchParams()
    if (from && to) {
      dashQs.set('from', from)
      dashQs.set('to', to)
    }
    const dashUrl = `${API_URL}/api/v1/crm/dashboard${dashQs.toString() ? `?${dashQs}` : ''}`

    const repQs = new URLSearchParams()
    if (from && to) {
      repQs.set('from', from)
      repQs.set('to', to)
    }
    repQs.set('months', '12')
    const repUrl = `${API_URL}/api/v1/crm/reports?${repQs}`

    const [dashRes, reportsRes] = await Promise.all([
      fetch(dashUrl, {
        headers: { Authorization: `Bearer ${token.accessToken}` },
        cache: 'no-store',
      }),
      fetch(repUrl, {
        headers: { Authorization: `Bearer ${token.accessToken}` },
        cache: 'no-store',
      }),
    ])

    const dashData = dashRes.ok ? await dashRes.json() : null
    const reportsData = reportsRes.ok ? await reportsRes.json() : null

    return { dashboard: dashData?.data, reports: reportsData?.data }
  } catch {
    return null
  }
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M FCFA`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k FCFA`
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `Il y a ${diffD}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const ENTITY_COLORS: Record<string, string> = {
  contact: 'oklch(0.42 0.16 260)',
  organization: 'oklch(0.42 0.14 200)',
  project: 'oklch(0.42 0.16 280)',
  devis: 'oklch(0.42 0.14 145)',
  invoice: 'oklch(0.5 0.2 40)',
  contract: 'oklch(0.5 0.18 20)',
  payment: 'oklch(0.42 0.14 145)',
}

const ACTION_ICON: Record<string, typeof CheckCircle> = {
  created: CheckCircle,
  updated: Clock,
  sent: TrendingUp,
  closed: CheckCircle,
  paid: CheckCircle,
  default: Clock,
}

const QUICK_ACTIONS = [
  { href: '/contacts/new', label: 'Nouveau contact', icon: Users, color: 'oklch(0.42 0.16 260)' },
  { href: '/devis/new', label: 'Nouveau devis', icon: FileText, color: 'oklch(0.42 0.14 145)' },
  { href: '/projects/new', label: 'Nouveau projet', icon: ClipboardList, color: 'oklch(0.42 0.16 280)' },
  { href: '/invoices/new', label: 'Nouvelle facture', icon: Receipt, color: 'oklch(0.5 0.2 40)' },
]

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  let from = rawDate(sp, 'from')
  let to = rawDate(sp, 'to')
  const end = new Date()
  const defaultTo = end.toISOString().slice(0, 10)
  const defaultFrom = new Date(end.getFullYear(), end.getMonth(), 1).toISOString().slice(0, 10)
  if (!from) from = defaultFrom
  if (!to) to = defaultTo
  if (from > to) {
    const x = from
    from = to
    to = x
  }

  const data = await getDashboardData(from, to)
  const kpis = data?.dashboard?.kpis ?? {}
  const activity = data?.dashboard?.activity ?? []
  const conversionRate = data?.reports?.conversionRates?.devisAcceptedToProject ?? null

  const cashFlowByMonth = Array.isArray(kpis.cashFlowByMonth) ? kpis.cashFlowByMonth : []
  const maxCf = Math.max(
    ...cashFlowByMonth.flatMap((r: { cashIn?: number; cashOut?: number }) => [
      Number(r.cashIn) || 0,
      Number(r.cashOut) || 0,
    ]),
    1
  )

  const invRev = Number(kpis.invoiceRevenueInPeriod ?? 0)
  const trev = Number(kpis.treasuryIncomeInPeriod ?? 0)
  const periodLabel =
    kpis.period?.from && kpis.period?.to
      ? `${kpis.period.from} → ${kpis.period.to}`
      : 'Période sélectionnée'

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-8 max-w-[1400px]">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            {today}
          </p>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ letterSpacing: '-0.02em', fontFamily: 'var(--font-scoop)' }}
          >
            Tableau de bord
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d&apos;ensemble de votre activité commerciale
          </p>
        </div>
        <Link
          href="/devis-requests"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-md)' }}
        >
          <Inbox className="h-4 w-4" />
          <span className="hidden sm:inline">Demandes</span>
          {(kpis.newDevisRequests ?? 0) > 0 && (
            <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[11px] font-bold">
              {kpis.newDevisRequests}
            </span>
          )}
        </Link>
      </div>

      <CrmDateRangeBar from={from} to={to} basePath="/dashboard" />

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Entrées (période)"
          value={formatMoney(kpis.revenueThisMonth ?? 0)}
          subtitle={
            trev > 0
              ? `${formatMoney(invRev)} factures · ${formatMoney(trev)} trésorerie`
              : `${formatMoney(invRev)} factures encaissées`
          }
          icon="dollar"
          trend="up"
          index={0}
        />
        <KpiCard
          title="Pipeline actif"
          value={kpis.pipelineCount ?? 0}
          subtitle={kpis.pipelineAmount ? formatMoney(kpis.pipelineAmount) : 'devis envoyés'}
          icon="file"
          trend="neutral"
          index={1}
        />
        <KpiCard
          title="Projets en cours"
          value={kpis.activeProjects ?? 0}
          subtitle={kpis.overdueProjects > 0 ? `⚠ ${kpis.overdueProjects} en retard` : 'Tout à jour'}
          icon="clipboard"
          trend={kpis.overdueProjects > 0 ? 'down' : 'up'}
          index={2}
        />
        <KpiCard
          title="Impayés"
          value={kpis.unpaidInvoicesCount ?? 0}
          subtitle={kpis.unpaidInvoicesAmount ? formatMoney(kpis.unpaidInvoicesAmount) : 'À encaisser'}
          icon="receipt"
          trend={kpis.unpaidInvoicesCount > 0 ? 'down' : 'up'}
          index={3}
        />
      </div>

      {/* Flux de trésorerie (factures + trésorerie + charges) */}
      {cashFlowByMonth.length > 0 && (
        <div className="crm-card p-6 crm-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold">Flux encaissements / décaissements</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {periodLabel} — inclut la{' '}
                <Link href="/treasury" className="text-primary hover:underline">
                  trésorerie
                </Link>
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <span className="block font-medium text-foreground">
                Net : {formatMoney(Number(kpis.netCashFlow ?? 0))}
              </span>
              Sorties : {formatMoney(Number(kpis.totalCashOut ?? 0))}
            </div>
          </div>
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Entrées
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500/80" />
              Sorties
            </span>
          </div>
          <div className="flex items-end gap-1 h-40">
            {cashFlowByMonth.map((row: { month: string; cashIn?: number; cashOut?: number }) => {
              const cin = Number(row.cashIn) || 0
              const cout = Number(row.cashOut) || 0
              const inPct = (cin / maxCf) * 100
              const outPct = (cout / maxCf) * 100
              return (
                <div key={row.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full flex items-end justify-center gap-0.5 h-32">
                    <div
                      className="flex-1 rounded-t bg-emerald-500/80 min-h-[2px] transition-all"
                      style={{ height: `${Math.max(inPct, cin > 0 ? 4 : 0)}%` }}
                      title={`${formatMonthLabel(row.month)} : +${formatMoney(cin)}`}
                    />
                    <div
                      className="flex-1 rounded-t bg-red-500/70 min-h-[2px] transition-all"
                      style={{ height: `${Math.max(outPct, cout > 0 ? 4 : 0)}%` }}
                      title={`${formatMonthLabel(row.month)} : −${formatMoney(cout)}`}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium truncate w-full text-center">
                    {formatMonthLabel(row.month)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Middle row: Quick actions + Conversion + Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Quick Actions */}
        <div className="crm-card p-5 crm-fade-in crm-stagger-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Actions rapides</h2>
            <span className="text-xs text-muted-foreground">Créer →</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-transparent transition-all group"
                  style={{
                    background: 'var(--muted)',
                  }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                    style={{ background: `${action.color}1a` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: action.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
                    {action.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Pipeline / Conversion */}
        <div className="crm-card p-5 crm-fade-in crm-stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Performance</h2>
            <Link href="/reports" className="text-xs text-primary hover:underline">Voir rapports →</Link>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Taux conversion devis</span>
                <span className="font-semibold">
                  {conversionRate !== null ? `${conversionRate.toFixed(0)}%` : '—'}
                </span>
              </div>
              <div className="crm-progress">
                <div className="crm-progress-bar" style={{ width: `${Math.min(conversionRate ?? 0, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Nouvelles demandes (7j)</span>
                <span className="font-semibold">{kpis.newDevisRequests ?? 0}</span>
              </div>
              <div className="crm-progress">
                <div className="crm-progress-bar" style={{ width: `${Math.min((kpis.newDevisRequests ?? 0) * 10, 100)}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pipeline total</span>
                <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                  {formatMoney(kpis.pipelineAmount ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="crm-card p-5 crm-fade-in crm-stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4" style={{ color: 'oklch(0.5 0.2 40)' }} />
            <h2 className="text-sm font-semibold">Alertes & priorités</h2>
          </div>
          {(kpis.overdueProjects > 0 || kpis.unpaidInvoicesCount > 0) ? (
            <div className="space-y-2">
              {kpis.overdueProjects > 0 && (
                <Link href="/projects?status=overdue" className="flex items-center gap-3 p-2.5 rounded-xl group"
                  style={{ background: 'oklch(0.9 0.12 40 / 0.12)' }}>
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg shrink-0"
                    style={{ background: 'oklch(0.9 0.12 40 / 0.2)' }}>
                    <Clock className="h-4 w-4" style={{ color: 'oklch(0.5 0.2 40)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'oklch(0.5 0.2 40)' }}>
                      {kpis.overdueProjects} projet{kpis.overdueProjects > 1 ? 's' : ''} en retard
                    </p>
                    <p className="text-[11px] text-muted-foreground">Délai dépassé</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'oklch(0.5 0.2 40)' }} />
                </Link>
              )}
              {kpis.unpaidInvoicesCount > 0 && (
                <Link href="/invoices?status=unpaid" className="flex items-center gap-3 p-2.5 rounded-xl group"
                  style={{ background: 'oklch(0.9 0.12 20 / 0.12)' }}>
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg shrink-0"
                    style={{ background: 'oklch(0.9 0.12 20 / 0.2)' }}>
                    <Receipt className="h-4 w-4" style={{ color: 'oklch(0.5 0.18 20)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'oklch(0.5 0.18 20)' }}>
                      {kpis.unpaidInvoicesCount} facture{kpis.unpaidInvoicesCount > 1 ? 's' : ''} impayée{kpis.unpaidInvoicesCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatMoney(kpis.unpaidInvoicesAmount ?? 0)}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'oklch(0.5 0.18 20)' }} />
                </Link>
              )}
            </div>
          ) : (
            <div className="crm-empty py-6">
              <CheckCircle className="crm-empty-icon h-8 w-8" style={{ color: 'oklch(0.42 0.14 145)', opacity: 0.5 }} />
              <p className="text-xs text-muted-foreground">Aucune alerte — tout est à jour</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="crm-card crm-fade-in crm-stagger-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold">Activité récente</h2>
          <Link href="/activity" className="flex items-center gap-1 text-xs text-primary hover:underline">
            Tout voir <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {activity.length > 0 ? (
          <ul className="divide-y divide-border">
            {activity.slice(0, 8).map((item: Record<string, unknown>, i: number) => {
              const entityType = String(item.entity_type ?? '')
              const ActionIcon = ACTION_ICON[String(item.action ?? '')] ?? ACTION_ICON.default
              const color = ENTITY_COLORS[entityType] ?? 'var(--muted-foreground)'
              return (
                <li key={String(item.id ?? i)} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full shrink-0"
                    style={{ background: `${color}1a` }}
                  >
                    <ActionIcon className="h-3.5 w-3.5" style={{ color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {String(item.description ?? item.action ?? '')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {entityType || 'CRM'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {timeAgo(String(item.created_at ?? ''))}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="crm-empty">
            <p className="crm-empty-title">Aucune activité récente</p>
            <p className="text-xs text-muted-foreground">Les actions CRM apparaîtront ici</p>
          </div>
        )}
      </div>

    </div>
  )
}
