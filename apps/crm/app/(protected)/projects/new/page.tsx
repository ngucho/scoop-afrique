import { Heading } from 'scoop'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { crmGetServer } from '@/lib/api-server'

export default async function NewProjectPage() {
  const [contactsRes, orgsRes, devisRes, servicesRes] = await Promise.all([
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('organizations?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('devis?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('services?limit=100'),
  ])
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

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouveau projet
      </Heading>
      <ProjectForm
        contacts={contacts}
        organizations={organizations}
        devis={devis}
        services={services}
      />
    </div>
  )
}
