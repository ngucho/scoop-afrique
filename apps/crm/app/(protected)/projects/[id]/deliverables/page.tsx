import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { DeliverablesList } from '@/components/projects/DeliverablesList'

export default async function ProjectDeliverablesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [projectRes, deliverablesRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`projects/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`projects/${id}/deliverables`),
  ])
  const project = projectRes?.data
  const deliverables = deliverablesRes?.data ?? []

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          Livrables — {project.title as string}
        </Heading>
        <Link href={`/projects/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Projet
        </Link>
      </div>
      <DeliverablesList projectId={id} initialDeliverables={deliverables} />
    </div>
  )
}
