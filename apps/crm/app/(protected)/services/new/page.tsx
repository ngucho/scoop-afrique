import { Heading } from 'scoop'
import { ServiceForm } from '@/components/services/ServiceForm'
import { requireCrmManage } from '@/lib/crm-admin'

export default async function NewServicePage() {
  await requireCrmManage()
  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Nouvelle prestation
      </Heading>

      <ServiceForm />
    </div>
  )
}
