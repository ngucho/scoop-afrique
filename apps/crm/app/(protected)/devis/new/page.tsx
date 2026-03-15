import { Heading } from 'scoop'
import { DevisBuilder } from '@/components/devis/DevisBuilder'
import { crmGetServer } from '@/lib/api-server'

export default async function NewDevisPage() {
  const [projectsResult, contactsResult, servicesResult] = await Promise.all([
    crmGetServer<Array<Record<string, unknown>>>('projects?with_contact=true&limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('services?active=true&limit=50'),
  ])
  const projects = (projectsResult?.data ?? []).map((p) => {
    const contact = p.crm_contacts as Record<string, unknown> | null
    return {
      id: p.id as string,
      reference: p.reference as string,
      title: p.title as string,
      contact: contact
        ? { first_name: contact.first_name as string, last_name: contact.last_name as string }
        : undefined,
    }
  })
  const contacts = (contactsResult?.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: c.first_name as string,
    last_name: c.last_name as string,
  }))
  const services = (servicesResult?.data ?? []).map((s) => ({
    id: s.id as string,
    slug: s.slug as string,
    name: s.name as string,
    description: s.description as string,
    unit: s.unit as string,
    default_price: (s.default_price as number) ?? 0,
  }))

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouveau devis
      </Heading>
      <DevisBuilder projects={projects} contacts={contacts} services={services} />
    </div>
  )
}
