import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { ProjectFinanceClient } from '@/components/projects/ProjectFinanceClient'

export default async function ProjectFinancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [projectRes, invoicesRes, expensesRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`projects/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`invoices?project_id=${id}&limit=50`),
    crmGetServer<Array<Record<string, unknown>>>(`projects/${id}/expenses`),
  ])
  const project = projectRes?.data
  const projectInvoices = invoicesRes?.data ?? []
  const expenses = expensesRes?.data ?? []

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          Finance — {project.title as string}
        </Heading>
        <Link href={`/projects/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Projet
        </Link>
      </div>

      <ProjectFinanceClient
        projectId={id}
        invoices={projectInvoices}
        expenses={expenses}
      />
    </div>
  )
}
