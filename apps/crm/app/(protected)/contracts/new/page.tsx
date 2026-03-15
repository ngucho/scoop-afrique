import { Heading } from 'scoop'
import { ContractForm } from '@/components/contracts/ContractForm'
import { crmGetServer } from '@/lib/api-server'

export default async function NewContractPage() {
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
        Nouveau contrat
      </Heading>
      <ContractForm contacts={contacts} projects={projects} />
    </div>
  )
}
