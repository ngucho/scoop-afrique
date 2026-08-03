'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useCrmCapabilities } from '@/components/auth/CrmCapabilitiesProvider'
import { ProjectClosureWizard } from './ProjectClosureWizard'

interface ReconciliationRow {
  project_id: string
  reference: string
  title: string
  archived_at: string | null
  archive_reason: string | null
  counts: Record<string, number>
  unresolved_invoice_total: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error('Chargement impossible')
  const json = (await response.json()) as { data?: ReconciliationRow[] }
  return json.data ?? []
}

/**
 * File des archives héritées : projets archivés avant la gestion des clôtures,
 * pour lesquels aucune opération n'a été enregistrée. La seule action offerte
 * est la régularisation.
 */
export function ProjectArchiveReconciliation() {
  const { canManage } = useCrmCapabilities()
  const { data, error, isLoading } = useSWR(
    canManage ? '/api/crm/projects/archive-reconciliation' : null,
    fetcher,
  )

  if (!canManage) return null
  if (isLoading) return null
  if (error) return null
  if (!data || data.length === 0) return null

  return (
    <section aria-label="Archives à régulariser" className="crm-card space-y-3 p-5">
      <header className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
        <h2 className="text-sm font-semibold">
          Archives à régulariser
          <span className="ml-2 crm-pill crm-pill-draft">{data.length}</span>
        </h2>
      </header>
      <p className="text-sm text-muted-foreground">
        Ces dossiers ont été archivés avant la mise en place des clôtures. Régularisez-les
        pour résoudre leurs factures ouvertes et sceller leur historique.
      </p>

      <ul className="divide-y divide-border">
        {data.map((row) => (
          <li
            key={row.project_id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <Link href={`/projects/${row.project_id}`} className="text-sm font-medium underline">
                {row.reference} — {row.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {Object.entries(row.counts)
                  .filter(([, count]) => count > 0)
                  .map(([key, count]) => `${count} ${key}`)
                  .join(' · ') || 'Aucune entité liée'}
                {row.unresolved_invoice_total > 0
                  ? ` · ${row.unresolved_invoice_total.toLocaleString('fr-FR')} FCFA non résolus`
                  : ''}
              </p>
            </div>
            <ProjectClosureWizard
              projectId={row.project_id}
              projectReference={row.reference}
              reconcile
              triggerLabel="Régulariser"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
