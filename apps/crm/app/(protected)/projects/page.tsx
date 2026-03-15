import Link from 'next/link'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { Plus, ClipboardList, Calendar, DollarSign, ArrowRight } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_progress: 'En cours',
  on_hold: 'En attente',
  completed: 'Terminé',
  closed: 'Clôturé',
  cancelled: 'Annulé',
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`
  return amount.toLocaleString('fr-FR')
}

export default async function ProjectsPage() {
  const result = await crmGetServer<Array<Record<string, unknown>>>('projects?limit=100')
  const projects = result?.data ?? []

  const stats = {
    active: projects.filter((p) => ['active', 'in_progress'].includes(String(p.status))).length,
    completed: projects.filter((p) => ['completed', 'closed'].includes(String(p.status))).length,
    totalBudget: projects.reduce((sum, p) => sum + (Number(p.budget_agreed) ?? 0), 0),
  }

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Projets</h1>
          <p className="crm-page-subtitle">{projects.length} projet{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/projects/new">
          <Button className="flex items-center gap-2 rounded-full px-5 font-semibold">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      {projects.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'En cours', value: stats.active, color: 'oklch(0.42 0.16 260)' },
            { label: 'Terminés', value: stats.completed, color: 'oklch(0.42 0.14 145)' },
            { label: 'Budget total', value: `${formatMoney(stats.totalBudget)} FCFA`, color: 'oklch(0.5 0.2 40)' },
          ].map((s) => (
            <div key={s.label} className="crm-card p-4 text-center crm-fade-in">
              <p className="text-2xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <ClipboardList className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucun projet</p>
            <p className="text-sm text-muted-foreground">Créez votre premier projet client</p>
            <Link href="/projects/new">
              <Button className="mt-4 rounded-full px-5">Créer un projet</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const status = String(p.status ?? 'draft')
            const statusLabel = STATUS_LABELS[status] ?? status
            const budget = Number(p.budget_agreed) || 0
            const startDate = p.start_date ? new Date(p.start_date as string).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : null
            const endDate = p.end_date ? new Date(p.end_date as string).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : null

            return (
              <Link
                key={p.id as string}
                href={`/projects/${p.id}`}
                className={`crm-card crm-card-interactive p-5 block group crm-fade-in crm-stagger-${Math.min(i % 4 + 1, 4) as 1|2|3|4}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
                      {String(p.reference ?? '')}
                    </p>
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {String(p.title ?? 'Sans titre')}
                    </h3>
                  </div>
                  <span className={`crm-pill crm-pill-${status} shrink-0`}>{statusLabel}</span>
                </div>

                {p.description != null && String(p.description) !== '' ? (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {String(p.description)}
                  </p>
                ) : null}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {(startDate || endDate) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {endDate ?? startDate}
                      </span>
                    )}
                    {budget > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatMoney(budget)}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
