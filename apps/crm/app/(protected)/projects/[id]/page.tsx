import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from 'scoop'
import { ProjectStatusActions } from '@/components/projects/ProjectStatusActions'
import { ProjectContactsWidget } from '@/components/projects/ProjectContactsWidget'
import { ProjectClosureWizard } from '@/components/projects/ProjectClosureWizard'
import { ProjectArchivedBanner } from '@/components/projects/ProjectArchivedBanner'
import { crmGetServer } from '@/lib/api-server'
import { ActivityClient } from '@/components/activity/ActivityClient'
import {
  Calendar,
  DollarSign,
  ClipboardList,
  Package,
  Target,
  Edit,
  ExternalLink,
} from 'lucide-react'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { AdminArchiveRestoreActions } from '@/components/admin/AdminArchiveRestoreActions'
import { CrmCapabilityGate } from '@/components/auth/CrmCapabilitiesProvider'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  paused: 'En pause',
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

  const [projectRes, contactsRes, allContactsRes, activityRes, folderRes, contractsRes] =
    await Promise.all([
      crmGetServer<Record<string, unknown>>(`projects/${id}`),
      crmGetServer<Array<Record<string, unknown>>>(`projects/${id}/contacts`),
      crmGetServer<Array<Record<string, unknown>>>('contacts?limit=200'),
      crmGetServer<Array<Record<string, unknown>>>(`activity/project/${id}?limit=50`),
      crmGetServer<Record<string, unknown>>(`projects/${id}/folder`),
      crmGetServer<Array<Record<string, unknown>>>(
        `contracts?project_id=${id}&archived=true&limit=100`,
      ),
    ])

  const project = projectRes?.data
  if (!project) notFound()

  const isAdmin = await getCrmIsAdmin()
  const isArchived = Boolean((project as Record<string, unknown>)['is_archived'])
  const projectReference = String(project.reference ?? '')
  // Un dossier « scellé » a été clôturé par l'assistant : il porte une opération.
  const isSealedArchive = isArchived && Boolean(project.archive_operation_id)
  const predecessorProjectId = project.predecessor_project_id
    ? String(project.predecessor_project_id)
    : null
  const projectContacts = contactsRes?.data ?? []
  const allContacts = allContactsRes?.data ?? []
  const activity = activityRes?.data ?? []
  const status = String(project.status ?? 'draft')
  const isActive = !['closed', 'cancelled', 'completed'].includes(status)
  const statusForActions = status as
    | 'draft'
    | 'confirmed'
    | 'in_progress'
    | 'paused'
    | 'review'
    | 'delivered'
    | 'closed'
    | 'cancelled'

  // Dossier archivé : les documents restent groupés et consultables en lecture.
  const folder = (folderRes?.data ?? {}) as Record<string, unknown>
  const folderDevis = folder.devis ? [folder.devis as Record<string, unknown>] : []
  const folderInvoices = (folder.invoices ?? []) as Array<Record<string, unknown>>
  const folderPayments = folderInvoices.flatMap(
    (invoice) => (invoice.payments ?? []) as Array<Record<string, unknown>>,
  )
  const money = (value: unknown) =>
    `${Number(value ?? 0).toLocaleString('fr-FR')} ${String(project.currency ?? 'FCFA')}`

  const historicalGroups = [
    {
      label: 'Devis',
      items: folderDevis.map((devis) => ({
        key: `devis-${String(devis.id)}`,
        label: String(devis.reference ?? devis.id),
        detail: money(devis.total),
      })),
    },
    {
      label: 'Factures et ajustements',
      items: folderInvoices.map((invoice) => ({
        key: `invoice-${String(invoice.id)}`,
        label: String(invoice.reference ?? invoice.id),
        detail: `${money(invoice.total)}${
          invoice.closure_resolution ? ` · ${String(invoice.closure_resolution)}` : ''
        }`,
      })),
    },
    {
      label: 'Paiements et reçus',
      items: folderPayments.map((payment) => ({
        key: `payment-${String(payment.id)}`,
        label: `${formatDate(payment.paid_at as string)}${
          payment.receipt_pdf_url ? ' · reçu disponible' : ''
        }`,
        detail: money(payment.amount),
      })),
    },
    {
      label: 'Contrats',
      items: (contractsRes?.data ?? []).map((contract) => ({
        key: `contract-${String(contract.id)}`,
        label: String(contract.reference ?? contract.id),
        detail: String(contract.status ?? ''),
      })),
    },
  ]

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
        {/* Un dossier archivé n'expose aucune action de mutation. */}
        {isArchived ? (
          <div className="shrink-0" />
        ) : (
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ProjectStatusActions projectId={id} status={statusForActions} />
            <div className="flex items-center gap-2">
              <CrmCapabilityGate capability="write">
                <Link href={`/projects/${id}/edit`}>
                  <button className="crm-quick-action">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                    <span className="hidden sm:inline">Modifier</span>
                  </button>
                </Link>
              </CrmCapabilityGate>
              <AdminArchiveRestoreActions
                resource="projects"
                id={id}
                isArchived={isArchived}
                isAdmin={isAdmin}
              />
              {isActive && (
                <ProjectClosureWizard projectId={id} projectReference={projectReference} />
              )}
            </div>
          </div>
        )}
      </div>

      {isArchived ? (
        <ProjectArchivedBanner
          projectId={id}
          archivedAt={project.archived_at as string | null}
          archiveReason={(project.archive_reason ?? project.closure_reason) as string | null}
          closureType={project.closure_type as string | null}
          sealed={isSealedArchive}
        />
      ) : null}

      {predecessorProjectId ? (
        <p className="text-sm text-muted-foreground">
          Ce projet fait suite au dossier archivé{' '}
          <Link href={`/projects/${predecessorProjectId}`} className="underline">
            voir le projet précédent
          </Link>
          .
        </p>
      ) : null}

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

      {isArchived ? (
        <section className="crm-card space-y-4 p-5" aria-label="Documents historiques">
          <h2 className="text-sm font-semibold">Documents historiques</h2>
          {historicalGroups.every((group) => group.items.length === 0) ? (
            <p className="text-sm text-muted-foreground">Aucun document rattaché à ce dossier.</p>
          ) : null}
          {historicalGroups.map((group) =>
            group.items.length === 0 ? null : (
              <div key={group.label} className="space-y-1">
                <h3 className="crm-section-title mb-0">
                  {group.label} ({group.items.length})
                </h3>
                <ul className="divide-y divide-border text-sm">
                  {group.items.map((item) => (
                    <li key={item.key} className="flex justify-between gap-3 py-2">
                      <span className="min-w-0 truncate">{item.label}</span>
                      <span className="shrink-0 text-muted-foreground">{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </section>
      ) : null}

      <div className="space-y-2">
        <p className="crm-section-title mb-0">Journal d&apos;activité</p>
        <ActivityClient initialActivity={activity} />
      </div>
    </div>
  )
}
