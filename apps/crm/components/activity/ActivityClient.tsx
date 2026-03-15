'use client'

import Link from 'next/link'
import {
  Users, Building2, FileText, ClipboardList, Receipt, FileSignature,
  DollarSign, Bell, CheckCircle, Edit, Send, X, Clock, type LucideIcon
} from 'lucide-react'

const ENTITY_LABELS: Record<string, string> = {
  contact: 'Contact',
  organization: 'Organisation',
  devis: 'Devis',
  project: 'Projet',
  invoice: 'Facture',
  contract: 'Contrat',
  payment: 'Paiement',
  reminder: 'Relance',
  'devis_request': 'Demande devis',
}

const ENTITY_PATHS: Record<string, (id: string) => string> = {
  contact: (id) => `/contacts/${id}`,
  organization: (id) => `/organizations/${id}`,
  devis: (id) => `/devis/${id}`,
  project: (id) => `/projects/${id}`,
  invoice: (id) => `/invoices/${id}`,
  contract: (id) => `/contracts/${id}`,
  payment: () => '/invoices',
  reminder: () => '/reminders',
  devis_request: (id) => `/devis-requests/${id}`,
}

const ENTITY_ICONS: Record<string, LucideIcon> = {
  contact: Users,
  organization: Building2,
  devis: FileText,
  project: ClipboardList,
  invoice: Receipt,
  contract: FileSignature,
  payment: DollarSign,
  reminder: Bell,
  devis_request: FileText,
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  created: CheckCircle,
  updated: Edit,
  sent: Send,
  closed: X,
  paid: DollarSign,
  signed: CheckCircle,
  default: Clock,
}

const ENTITY_COLORS: Record<string, string> = {
  contact: 'oklch(0.42 0.16 260)',
  organization: 'oklch(0.42 0.14 200)',
  devis: 'oklch(0.42 0.14 145)',
  project: 'oklch(0.42 0.16 280)',
  invoice: 'oklch(0.5 0.2 40)',
  contract: 'oklch(0.5 0.18 20)',
  payment: 'oklch(0.42 0.14 145)',
  reminder: 'oklch(0.5 0.16 300)',
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function ActivityClient({
  initialActivity,
}: {
  initialActivity: Array<Record<string, unknown>>
}) {
  if (initialActivity.length === 0) {
    return (
      <div className="crm-card crm-empty py-16">
        <Clock className="crm-empty-icon h-10 w-10" />
        <p className="crm-empty-title">Aucune activité</p>
        <p className="text-xs text-muted-foreground">Les actions CRM apparaîtront ici</p>
      </div>
    )
  }

  return (
    <div className="crm-card overflow-hidden">
      <ul className="divide-y divide-border">
        {initialActivity.map((item, i) => {
          const entityType = String(item.entity_type ?? '')
          const entityId = String(item.entity_id ?? '')
          const action = String(item.action ?? '')
          const pathFn = ENTITY_PATHS[entityType]
          const href = pathFn ? pathFn(entityId) : null
          const label = ENTITY_LABELS[entityType] ?? entityType
          const EntityIcon = ENTITY_ICONS[entityType] ?? Clock
          const ActionIcon = ACTION_ICONS[action] ?? ACTION_ICONS.default
          const color = ENTITY_COLORS[entityType] ?? 'var(--muted-foreground)'

          return (
            <li
              key={String(item.id ?? i)}
              className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1|2|3|4}`}
            >
              {/* Entity icon */}
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full shrink-0"
                style={{ background: `${color}18` }}
              >
                <EntityIcon className="h-3.5 w-3.5" style={{ color }} strokeWidth={2} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {String(item.description ?? `${label} · ${action}`)}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold" style={{ color }}>
                    {label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground capitalize flex items-center gap-1">
                    <ActionIcon className="h-2.5 w-2.5" />
                    {action}
                  </span>
                </div>
              </div>

              {/* Time + link */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {timeAgo(String(item.created_at ?? ''))}
                </span>
                {href && (
                  <Link
                    href={href}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Voir →
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
