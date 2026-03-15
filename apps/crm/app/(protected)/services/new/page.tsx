import { Heading } from 'scoop'
import { ServiceForm } from '@/components/services/ServiceForm'

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouvelle prestation
      </Heading>

      <ServiceForm />
    </div>
  )
}
