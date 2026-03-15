import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { ContractForm } from '@/components/contracts/ContractForm'

export default async function ContractEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await crmGetServer<Record<string, unknown>>(`contracts/${id}`)
  const contract = result?.data

  if (!contract) notFound()

  const content = contract.content as Record<string, unknown>
  const defaultValues = {
    title: contract.title as string,
    type: contract.type as string,
    contact_id: contract.contact_id as string,
    project_id: contract.project_id as string,
    expires_at: contract.expires_at ? (contract.expires_at as string).slice(0, 10) : undefined,
    content: content ? JSON.stringify(content, null, 2) : '',
  }

  const [contactsRes, projectsRes] = await Promise.all([
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('projects?limit=100'),
  ])
  const contacts = (contactsRes?.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: c.first_name as string,
    last_name: c.last_name as string,
  }))
  const projects = (projectsRes?.data ?? []).map((p) => ({
    id: p.id as string,
    reference: p.reference as string,
    title: p.title as string,
  }))

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Modifier le contrat {contract.reference as string}
      </Heading>
      <ContractForm
        contractId={id}
        defaultValues={defaultValues}
        contacts={contacts}
        projects={projects}
      />
    </div>
  )
}
