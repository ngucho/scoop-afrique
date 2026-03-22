'use client'

import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  FileText,
  ClipboardList,
  Receipt,
  Inbox,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  dollar: DollarSign,
  file: FileText,
  clipboard: ClipboardList,
  receipt: Receipt,
  inbox: Inbox,
  alert: AlertTriangle,
}

/** Couleurs d’accent du value — alignées sur FinancialReportClient / FinancialKpi */
const VALUE_COLOR: Record<string, string> = {
  dollar: 'oklch(0.42 0.14 145)',
  file: 'oklch(0.42 0.16 260)',
  clipboard: 'oklch(0.42 0.16 280)',
  receipt: 'oklch(0.5 0.2 40)',
  inbox: 'oklch(0.42 0.16 260)',
  alert: 'oklch(0.5 0.18 20)',
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up')
    return (
      <span
        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: 'color-mix(in oklab, var(--state-success) 15%, transparent)',
          color: 'var(--state-success)',
        }}
      >
        <TrendingUp className="h-3 w-3" />
      </span>
    )
  if (trend === 'down')
    return (
      <span
        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: 'color-mix(in oklab, var(--state-error) 15%, transparent)',
          color: 'var(--state-error)',
        }}
      >
        <TrendingDown className="h-3 w-3" />
      </span>
    )
  return (
    <span
      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
    >
      <Minus className="h-3 w-3" />
    </span>
  )
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  index = 0,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon?: 'dollar' | 'file' | 'clipboard' | 'receipt' | 'inbox' | 'alert'
  trend?: 'up' | 'down' | 'neutral'
  index?: number
}) {
  const Icon = icon ? ICON_MAP[icon] : null
  const valueColor = icon ? VALUE_COLOR[icon] ?? 'var(--foreground)' : 'var(--foreground)'

  return (
    <div
      className={`crm-card p-5 crm-fade-in crm-stagger-${Math.min(index + 1, 4) as 1 | 2 | 3 | 4}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
            {title}
          </p>
          <p
            className="text-2xl font-bold tracking-tight leading-none"
            style={{ letterSpacing: '-0.02em', color: valueColor }}
          >
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
              <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            </div>
          )}
          {trend && <TrendBadge trend={trend} />}
        </div>
      </div>
    </div>
  )
}
