import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { DevisBuilder } from '@/components/devis/DevisBuilder'

export default async function DevisEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await crmGetServer<Record<string, unknown>>(`devis/${id}`)
  const devis = result?.data

  if (!devis) notFound()

  const lineItems = ((devis.line_items as Array<Record<string, unknown>>) ?? []).map((i) => ({
    description: i.description as string,
    quantity: (i.quantity as number) ?? 1,
    unit_price: (i.unit_price as number) ?? 0,
    unit: (i.unit as string) ?? 'unité',
    tax_rate: (i.tax_rate as number) ?? 0,
  }))

  const defaultValues = {
    title: devis.title as string,
    project_id: (devis.project_id as string) ?? '',
    contact_id: devis.contact_id as string,
    service_slug: devis.service_slug as string,
    line_items: lineItems.length > 0 ? lineItems : [{ description: '', quantity: 1, unit_price: 0, unit: 'unité', tax_rate: 0 }],
    tax_rate: (devis.tax_rate as number) ?? 0,
    valid_until: devis.valid_until ? (devis.valid_until as string).slice(0, 10) : undefined,
    notes: devis.notes as string,
  }

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
        Modifier le devis {devis.reference as string}
      </Heading>
      <DevisBuilder devisId={id} defaultValues={defaultValues} projects={projects} contacts={contacts} services={services} />
    </div>
  )
}
