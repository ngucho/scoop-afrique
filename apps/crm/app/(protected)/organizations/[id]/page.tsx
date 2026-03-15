import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { OrganizationContacts } from '@/components/organizations/OrganizationContacts'

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [orgRes, contactsRes, allContactsRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`organizations/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`organizations/${id}/contacts`),
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=200'),
  ])
  const org = orgRes?.data
  const contacts = contactsRes?.data ?? []
  const allContacts = (allContactsRes?.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: c.first_name as string,
    last_name: c.last_name as string,
  }))

  if (!org) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          {String(org.name ?? '—')}
        </Heading>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Type</span>
          <p>{String(org.type ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Email</span>
          <p>{String(org.email ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Téléphone</span>
          <p>{String(org.phone ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Site web</span>
          <p>{String(org.website ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Adresse</span>
          <p>{String(org.address ?? '—')}</p>
        </div>
        {org.notes ? (
          <div>
            <span className="text-sm text-muted-foreground">Notes</span>
            <p className="whitespace-pre-wrap">{String(org.notes)}</p>
          </div>
        ) : null}
      </div>

      <OrganizationContacts
        organizationId={id}
        initialContacts={contacts as Array<{ id: string; first_name?: string; last_name?: string; email?: string; role?: string }>}
        allContacts={allContacts}
      />
    </div>
  )
}
