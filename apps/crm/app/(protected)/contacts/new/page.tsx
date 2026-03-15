import { Heading } from 'scoop'
import { ContactForm } from '@/components/contacts/ContactForm'
import { crmGetServer } from '@/lib/api-server'

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ devis_request_id?: string }>
}) {
  const params = await searchParams
  const devisRequestId = params.devis_request_id
  let defaultValues: Partial<{
    first_name: string
    last_name: string
    email: string
    phone: string
    company: string
    source: string
    devis_request_id: string
  }> | undefined

  if (devisRequestId) {
    const result = await crmGetServer<Record<string, unknown>>(`devis-requests/${devisRequestId}`)
    const req = result?.data
    if (req) {
      defaultValues = {
        first_name: (req.first_name as string) ?? '',
        last_name: (req.last_name as string) ?? '',
        email: (req.email as string) ?? '',
        phone: (req.phone as string) ?? '',
        company: (req.company as string) ?? '',
        source: 'Demande de devis',
        devis_request_id: devisRequestId,
      }
    }
  }

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouveau contact
      </Heading>
      <ContactForm defaultValues={defaultValues} />
    </div>
  )
}
