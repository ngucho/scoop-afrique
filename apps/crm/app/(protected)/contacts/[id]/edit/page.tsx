import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { ContactForm } from '@/components/contacts/ContactForm'

export default async function ContactEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await crmGetServer<Record<string, unknown>>(`contacts/${id}`)
  const contact = result?.data

  if (!contact) notFound()

  const defaultValues = {
    first_name: contact.first_name as string,
    last_name: contact.last_name as string,
    email: contact.email as string,
    phone: contact.phone as string,
    whatsapp: contact.whatsapp as string,
    company: contact.company as string,
    type: contact.type as 'prospect' | 'client' | 'partner' | 'sponsor' | 'influencer' | 'other',
  }

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Modifier le contact
      </Heading>
      <ContactForm contactId={id} defaultValues={defaultValues} />
    </div>
  )
}
