import { Heading } from 'scoop'
import { OrganizationForm } from '@/components/organizations/OrganizationForm'

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouvelle organisation
      </Heading>
      <OrganizationForm />
    </div>
  )
}
