import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from 'scoop'
import { ProjectCloseButton } from '@/components/projects/ProjectCloseButton'
import { ProjectContactsWidget } from '@/components/projects/ProjectContactsWidget'
import { crmGetServer } from '@/lib/api-server'
import {
  Calendar,
  DollarSign,
  ClipboardList,
  Package,
  Target,
  Edit,
  ExternalLink,
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  review: 'Revue',
  delivered: 'Livré',
  on_hold: 'En attente',
  completed: 'Terminé',
  closed: 'Clôturé',
  cancelled: 'Annulé',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr as string).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [projectRes, contactsRes, allContactsRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`projects/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`projects/${id}/contacts`),
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=200'),
  ])

  const project = projectRes?.data
  if (!project) notFound()

  const projectContacts = contactsRes?.data ?? []
  const allContacts = allContactsRes?.data ?? []
  const status = String(project.status ?? 'draft')
  const isActive = !['closed', 'cancelled', 'completed'].includes(status)

  const SUB_TABS = [
    { href: `/projects/${id}/tasks`, label: 'Tâches', icon: ClipboardList },
    { href: `/projects/${id}/deliverables`, label: 'Livrables', icon: Package },
    { href: `/projects/${id}/finance`, label: 'Finance', icon: DollarSign },
  ]

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{String(project.reference ?? '')}</span>
            <span className={`crm-pill crm-pill-${status}`}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
          <h1 className="crm-page-title">{String(project.title ?? 'Projet sans titre')}</h1>
          {project.description != null && String(project.description) !== '' ? (
            <p className="crm-page-subtitle mt-1 line-clamp-2">{String(project.description)}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/projects/${id}/edit`}>
            <button className="crm-quick-action">
              <Edit className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Modifier</span>
            </button>
          </Link>
          {isActive && <ProjectCloseButton projectId={id} />}
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--muted)' }}>
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:bg-card"
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              {tab.label}
              <ExternalLink className="h-3 w-3 opacity-40" />
            </Link>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Info card - left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Key info */}
          <div className="crm-card p-5">
            <h2 className="text-sm font-semibold mb-4">Informations projet</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Date de début
                </p>
                <p className="text-sm font-medium">{formatDate(project.start_date as string)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Date de fin
                </p>
                <p className="text-sm font-medium">{formatDate(project.end_date as string)}</p>
              </div>
              {project.budget_agreed != null && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3" /> Budget convenu
                  </p>
                  <p className="text-sm font-bold">
                    {Number(project.budget_agreed).toLocaleString('fr-FR')} {String(project.currency ?? 'FCFA')}
                  </p>
                </div>
              )}
              {project.service_slug != null && String(project.service_slug) !== '' ? (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Package className="h-3 w-3" /> Service
                  </p>
                  <p className="text-sm font-medium">{String(project.service_slug)}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Objectives */}
          {project.objectives != null && String(project.objectives) !== '' ? (
            <div className="crm-card p-5">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                Objectifs
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {String(project.objectives)}
              </p>
            </div>
          ) : null}

          {/* Deliverables summary */}
          {project.deliverables_summary != null && String(project.deliverables_summary) !== '' ? (
            <div className="crm-card p-5">
              <h2 className="text-sm font-semibold mb-3">Livrables attendus</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {String(project.deliverables_summary)}
              </p>
            </div>
          ) : null}

          {/* Notes */}
          {project.notes != null && String(project.notes) !== '' ? (
            <div className="crm-card p-5">
              <h2 className="text-sm font-semibold mb-3">Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {String(project.notes)}
              </p>
            </div>
          ) : null}
        </div>

        {/* Right column: contacts */}
        <div>
          <ProjectContactsWidget
            projectId={id}
            initialContacts={projectContacts}
            allContacts={allContacts}
          />
        </div>
      </div>
    </div>
  )
}
