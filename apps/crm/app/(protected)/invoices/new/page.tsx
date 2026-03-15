import { Heading } from 'scoop'
import { InvoiceBuilder } from '@/components/invoices/InvoiceBuilder'
import { crmGetServer } from '@/lib/api-server'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string }>
}) {
  const params = await searchParams
  const projectId = params.project_id

  const [contactsRes, projectsRes, folderRes] = await Promise.all([
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('projects?limit=100'),
    projectId
      ? crmGetServer<{
          project: Record<string, unknown>
          devis: Record<string, unknown> | null
          invoices: Array<Record<string, unknown>>
        }>(`projects/${projectId}/folder`)
      : Promise.resolve(null),
  ])

  const contacts = (contactsRes?.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: c.first_name as string,
    last_name: c.last_name as string,
  }))
  const projects = (projectsRes?.data ?? []).map((p) => ({
    id: p.id as string,
    reference: p.reference as string,
    title: p.title as string,
  }))

  const folder = folderRes?.data
  const devisLineItems = folder?.devis && Array.isArray((folder.devis as Record<string, unknown>).line_items)
    ? ((folder.devis as Record<string, unknown>).line_items as Array<Record<string, unknown>>)
    : undefined
  const lineItemsFromProject = devisLineItems && devisLineItems.length > 0 ? devisLineItems : undefined

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouvelle facture
      </Heading>
      <InvoiceBuilder
        contacts={contacts}
        projects={projects}
        defaultProjectId={projectId}
        lineItemsFromProject={lineItemsFromProject}
      />
    </div>
  )
}
