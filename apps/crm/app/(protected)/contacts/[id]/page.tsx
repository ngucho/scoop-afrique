import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { ContactOrganizations } from '@/components/contacts/ContactOrganizations'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { AdminArchiveRestoreActions } from '@/components/admin/AdminArchiveRestoreActions'
import { ActivityClient } from '@/components/activity/ActivityClient'

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [contactRes, orgsRes, allOrgsRes, activityRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`contacts/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`contacts/${id}/organizations`),
    crmGetServer<Array<Record<string, unknown>>>('organizations?limit=200'),
    crmGetServer<Array<Record<string, unknown>>>(`activity/contact/${id}?limit=50`),
  ])
  const contact = contactRes?.data
  const orgs = orgsRes?.data ?? []
  const allOrgs = (allOrgsRes?.data ?? []).map((o) => ({ id: o.id as string, name: o.name as string }))

  const activity = activityRes?.data ?? []

  if (!contact) notFound()

  const name = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || '—'
  const isAdmin = await getCrmIsAdmin()
  const isArchived = Boolean((contact as Record<string, unknown>)['is_archived'])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          {name}
        </Heading>
        <div className="flex items-center gap-2">
          <Link href={`/contacts/${id}/edit`}>
            <Button variant="outline">Modifier</Button>
          </Link>
          <AdminArchiveRestoreActions
            resource="contacts"
            id={id}
            isArchived={isArchived}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Email</span>
          <p>{String(contact.email ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Téléphone</span>
          <p>{String(contact.phone ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">WhatsApp</span>
          <p>{String(contact.whatsapp ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Entreprise</span>
          <p>{String(contact.company ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Type</span>
          <p className="capitalize">{String(contact.type ?? '—')}</p>
        </div>
        {contact.notes ? (
          <div>
            <span className="text-sm text-muted-foreground">Notes</span>
            <p className="whitespace-pre-wrap">{String(contact.notes)}</p>
          </div>
        ) : null}
      </div>

      <ContactOrganizations
        contactId={id}
        initialOrgs={orgs as Array<{ id: string; name: string; type?: string; role?: string }>}
        allOrganizations={allOrgs}
      />

      <div className="space-y-2">
        <p className="crm-section-title mb-0">Journal d&apos;activité</p>
        <ActivityClient initialActivity={activity} />
      </div>
    </div>
  )
}
