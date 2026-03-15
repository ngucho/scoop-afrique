import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { ServiceForm } from '@/components/services/ServiceForm'

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await crmGetServer<Record<string, unknown>>(`services/${id}`)
  const service = res?.data

  if (!service) notFound()

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Modifier la prestation
      </Heading>

      <ServiceForm serviceId={id} defaultValues={service as Record<string, unknown>} />
    </div>
  )
}
