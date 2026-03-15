import { Heading } from 'scoop'
import { ContactForm } from '@/components/contacts/ContactForm'

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouveau contact
      </Heading>
      <ContactForm />
    </div>
  )
}
