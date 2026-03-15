import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { crmGetServer } from '@/lib/api-server'
import { BackLink } from 'scoop'

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [projectRes, contactsRes, orgsRes, devisRes, servicesRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`projects/${id}`),
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('organizations?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('devis?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('services?limit=100'),
  ])

  const project = projectRes?.data
  if (!project) notFound()

  const contacts = (contactsRes?.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: c.first_name as string,
    last_name: c.last_name as string,
  }))
  const organizations = (orgsRes?.data ?? []).map((o) => ({
    id: o.id as string,
    name: o.name as string,
  }))
  const devis = (devisRes?.data ?? []).map((d) => ({
    id: d.id as string,
    reference: d.reference as string,
    title: d.title as string,
  }))
  const services = (servicesRes?.data ?? []).map((s) => ({
    slug: s.slug as string,
    name: s.name as string,
  }))

  const defaultValues = {
    title: project.title as string,
    contact_id: (project.contact_id as string) ?? '',
    organization_id: (project.organization_id as string) ?? '',
    devis_id: (project.devis_id as string) ?? '',
    service_slug: (project.service_slug as string) ?? '',
    description: (project.description as string) ?? '',
    objectives: (project.objectives as string) ?? '',
    deliverables_summary: (project.deliverables_summary as string) ?? '',
    start_date: project.start_date ? (project.start_date as string).toString().slice(0, 10) : '',
    end_date: project.end_date ? (project.end_date as string).toString().slice(0, 10) : '',
    budget_agreed: project.budget_agreed as number,
    notes: (project.notes as string) ?? '',
    internal_notes: (project.internal_notes as string) ?? '',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <BackLink href={`/projects/${id}`}>Retour au projet</BackLink>
      <h1 className="text-2xl font-bold">Modifier le projet</h1>
      <ProjectForm
        projectId={id}
        defaultValues={defaultValues}
        contacts={contacts}
        organizations={organizations}
        devis={devis}
        services={services}
      />
    </div>
  )
}
