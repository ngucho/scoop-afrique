import { Heading } from 'scoop'
import { OrganizationForm } from '@/components/organizations/OrganizationForm'
import { requireCrmWrite } from '@/lib/crm-admin'

export default async function NewOrganizationPage() {
  await requireCrmWrite()
  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouvelle organisation
      </Heading>
      <OrganizationForm />
    </div>
  )
}
