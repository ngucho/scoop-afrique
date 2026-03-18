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

const COLOR_MAP: Record<
  string,
  { cardBg: string; cardBorder: string; iconBg: string; icon: string; accent: string }
> = {
  // Make KPI cards clearly visible by basing accent on primary/secondary tokens.
  dollar: {
    cardBg: 'color-mix(in oklab, var(--primary) 8%, var(--card))',
    cardBorder: 'color-mix(in oklab, var(--primary) 45%, var(--border))',
    iconBg: 'color-mix(in oklab, var(--primary) 14%, transparent)',
    icon: 'var(--primary)',
    accent: 'var(--primary)',
  },
  file: {
    cardBg: 'color-mix(in oklab, var(--secondary) 8%, var(--card))',
    cardBorder: 'color-mix(in oklab, var(--secondary) 45%, var(--border))',
    iconBg: 'color-mix(in oklab, var(--secondary) 14%, transparent)',
    icon: 'var(--secondary)',
    accent: 'var(--secondary)',
  },
  clipboard: {
    cardBg: 'color-mix(in oklab, var(--primary) 8%, var(--card))',
    cardBorder: 'color-mix(in oklab, var(--primary) 45%, var(--border))',
    iconBg: 'color-mix(in oklab, var(--primary) 14%, transparent)',
    icon: 'var(--primary)',
    accent: 'var(--primary)',
  },
  receipt: {
    cardBg: 'color-mix(in oklab, var(--secondary) 8%, var(--card))',
    cardBorder: 'color-mix(in oklab, var(--secondary) 45%, var(--border))',
    iconBg: 'color-mix(in oklab, var(--secondary) 14%, transparent)',
    icon: 'var(--secondary)',
    accent: 'var(--secondary)',
  },
  inbox: {
    cardBg: 'color-mix(in oklab, var(--primary) 8%, var(--card))',
    cardBorder: 'color-mix(in oklab, var(--primary) 45%, var(--border))',
    iconBg: 'color-mix(in oklab, var(--primary) 14%, transparent)',
    icon: 'var(--primary)',
    accent: 'var(--primary)',
  },
  alert: {
    cardBg: 'color-mix(in oklab, var(--state-warning) 10%, var(--card))',
    cardBorder: 'color-mix(in oklab, var(--state-warning) 45%, var(--border))',
    iconBg: 'color-mix(in oklab, var(--state-warning) 14%, transparent)',
    icon: 'var(--state-warning)',
    accent: 'var(--state-warning)',
  },
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'neutral'; value?: string }) {
  if (trend === 'up') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'color-mix(in oklab, var(--state-success) 15%, transparent)', color: 'var(--state-success)' }}>
      <TrendingUp className="h-3 w-3" />
    </span>
  )
  if (trend === 'down') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'color-mix(in oklab, var(--state-error) 15%, transparent)', color: 'var(--state-error)' }}>
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
      style={
        colors
          ? { background: colors.cardBg, borderColor: colors.cardBorder }
          : undefined
      }
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
              style={{ background: colors.iconBg }}
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
