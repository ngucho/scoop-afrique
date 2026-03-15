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

const COLOR_MAP: Record<string, { bg: string; icon: string; accent: string }> = {
  dollar:    { bg: 'oklch(0.94 0.08 145 / 0.12)', icon: 'oklch(0.42 0.14 145)', accent: 'oklch(0.42 0.14 145)' },
  file:      { bg: 'oklch(0.93 0.08 260 / 0.12)', icon: 'oklch(0.42 0.16 260)', accent: 'oklch(0.42 0.16 260)' },
  clipboard: { bg: 'oklch(0.93 0.08 200 / 0.12)', icon: 'oklch(0.42 0.14 200)', accent: 'oklch(0.42 0.14 200)' },
  receipt:   { bg: 'oklch(0.93 0.1 40 / 0.12)',   icon: 'oklch(0.5 0.2 40)',    accent: 'oklch(0.5 0.2 40)' },
  inbox:     { bg: 'oklch(0.93 0.08 280 / 0.12)', icon: 'oklch(0.42 0.16 280)', accent: 'oklch(0.42 0.16 280)' },
  alert:     { bg: 'oklch(0.94 0.1 60 / 0.12)',   icon: 'oklch(0.5 0.2 60)',    accent: 'oklch(0.5 0.2 60)' },
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'neutral'; value?: string }) {
  if (trend === 'up') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'oklch(0.9 0.1 145 / 0.15)', color: 'oklch(0.4 0.12 145)' }}>
      <TrendingUp className="h-3 w-3" />
    </span>
  )
  if (trend === 'down') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'oklch(0.9 0.12 20 / 0.15)', color: 'oklch(0.5 0.18 20)' }}>
      <TrendingDown className="h-3 w-3" />
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
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
  const colors = icon ? COLOR_MAP[icon] : null

  return (
    <div
      className={`crm-card crm-kpi p-5 crm-fade-in crm-stagger-${Math.min(index + 1, 4) as 1 | 2 | 3 | 4}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold tracking-wider uppercase mb-3"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {title}
          </p>
          <p
            className="text-2xl font-bold tracking-tight leading-none"
            style={{ letterSpacing: '-0.02em', color: 'var(--foreground)' }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {Icon && colors && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: colors.bg }}
            >
              <Icon className="h-4 w-4" style={{ color: colors.icon }} strokeWidth={2} />
            </div>
          )}
          {trend && <TrendBadge trend={trend} />}
        </div>
      </div>
    </div>
  )
}
