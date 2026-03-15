import Link from 'next/link'
import { notFound } from 'next/navigation'
import { crmGetServer } from '@/lib/api-server'
import { ProjectFinanceClient } from '@/components/projects/ProjectFinanceClient'
import { DollarSign, ExternalLink } from 'lucide-react'

export default async function ProjectFinancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const folderRes = await crmGetServer<{
    project: Record<string, unknown>
    devis: Record<string, unknown> | null
    invoices: Array<Record<string, unknown> & { payments?: Array<Record<string, unknown>> }>
    contacts: Array<Record<string, unknown>>
    devis_request: Record<string, unknown> | null
    expenses: Array<Record<string, unknown>>
  }>(`projects/${id}/folder`)

  const folder = folderRes?.data
  if (!folder?.project) notFound()

  const project = folder.project
  const devis = folder.devis ?? null
  const projectInvoices = folder.invoices ?? []
  const expenses = folder.expenses ?? []

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-muted-foreground" strokeWidth={1.8} />
            Finance — {project.title as string}
          </h1>
          <p className="crm-page-subtitle">
            Devis, factures, reçus et dépenses du projet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/new?project_id=${id}`}
            className="crm-quick-action"
          >
            <span>+ Nouvelle facture</span>
          </Link>
          <Link href={`/projects/${id}`} className="crm-quick-action text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Retour projet</span>
          </Link>
        </div>
      </div>

      <ProjectFinanceClient
        projectId={id}
        project={project}
        devis={devis}
        invoices={projectInvoices}
        expenses={expenses}
      />
    </div>
  )
}
