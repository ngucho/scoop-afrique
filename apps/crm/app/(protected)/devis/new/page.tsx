import { Heading } from 'scoop'
import { DevisBuilder } from '@/components/devis/DevisBuilder'
import { crmGetServer } from '@/lib/api-server'

export default async function NewDevisPage({
  searchParams,
}: {
  searchParams: Promise<{ devis_request_id?: string }>
}) {
  const params = await searchParams
  const devisRequestId = params.devis_request_id

  const [projectsResult, contactsResult, servicesResult, devisRequestResult] = await Promise.all([
    crmGetServer<Array<Record<string, unknown>>>('projects?with_contact=true&limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('services?active=true&limit=50'),
    devisRequestId ? crmGetServer<Record<string, unknown>>(`devis-requests/${devisRequestId}`) : Promise.resolve(null),
  ])

  let contactByEmailResult: { data?: Record<string, unknown> } | null = null
  if (devisRequestId && devisRequestResult?.data) {
    const email = (devisRequestResult.data as Record<string, unknown>).email as string | undefined
    if (email?.trim()) {
      contactByEmailResult = await crmGetServer<Record<string, unknown>>(
        `contacts/by-email?email=${encodeURIComponent(email.trim())}`
      )
    }
  }
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

  let defaultValues:
    | Partial<{
        title: string
        service_slug: string
        devis_request_id: string
        contact_id: string
        line_items: Array<{ description: string; quantity: number; unit_price: number; unit: string; tax_rate: number }>
      }>
    | undefined

  if (devisRequestId && devisRequestResult?.data) {
    const req = devisRequestResult.data as Record<string, unknown>
    const firstName = (req.first_name as string) ?? ''
    const lastName = (req.last_name as string) ?? ''
    const serviceSlug = (req.service_slug as string) ?? ''
    const contactId = (contactByEmailResult?.data as Record<string, unknown>)?.id as string | undefined
    const matchingService = services.find((s) => s.slug === serviceSlug)
    defaultValues = {
      title: `Devis — ${[firstName, lastName].filter(Boolean).join(' ')}${serviceSlug ? ` — ${serviceSlug}` : ''}`.trim() || 'Devis',
      service_slug: serviceSlug || undefined,
      devis_request_id: devisRequestId,
      contact_id: contactId || undefined,
      line_items: matchingService
        ? [{ description: matchingService.name, quantity: 1, unit_price: matchingService.default_price, unit: matchingService.unit, tax_rate: 0 }]
        : undefined,
    }
  }

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouveau devis
      </Heading>
      <DevisBuilder projects={projects} contacts={contacts} services={services} defaultValues={defaultValues} />
    </div>
  )
}
