import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { ContractActions } from '@/components/contracts/ContractActions'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { AdminArchiveRestoreActions } from '@/components/admin/AdminArchiveRestoreActions'
import { ActivityClient } from '@/components/activity/ActivityClient'

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [result, activityRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`contracts/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`activity/contract/${id}?limit=50`),
  ])
  const contract = result?.data
  const activity = activityRes?.data ?? []

  if (!contract) notFound()

  const isAdmin = await getCrmIsAdmin()
  const isArchived = Boolean((contract as Record<string, unknown>)['is_archived'])

  const content = contract.content as Record<string, unknown>
  const contentKeys = content ? Object.keys(content) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          {contract.reference as string} — {contract.title as string}
        </Heading>
        <div className="flex items-center gap-2">
          <ContractActions contractId={id} status={contract.status as string} />
          <AdminArchiveRestoreActions
            resource="contracts"
            id={id}
            isArchived={isArchived}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Type</span>
          <p className="capitalize">{String(contract.type ?? '—')}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Statut</span>
          <p className="capitalize">{String(contract.status ?? '—')}</p>
        </div>
        {contract.expires_at ? (
          <div>
            <span className="text-sm text-muted-foreground">Expire le</span>
            <p>{new Date(contract.expires_at as string).toLocaleDateString('fr-FR')}</p>
          </div>
        ) : null}
        {contract.signed_at ? (
          <div>
            <span className="text-sm text-muted-foreground">Signé le</span>
            <p>{new Date(contract.signed_at as string).toLocaleDateString('fr-FR')}</p>
          </div>
        ) : null}
        {contentKeys.length > 0 ? (
          <div>
            <span className="text-sm text-muted-foreground">Contenu</span>
            <pre className="mt-2 p-4 rounded bg-muted/50 text-sm overflow-auto max-h-96">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="crm-section-title mb-0">Journal d&apos;activité</p>
        <ActivityClient initialActivity={activity} />
      </div>

      <Link href={`/contracts/${id}/edit`}>
        <Button variant="outline">Modifier</Button>
      </Link>
    </div>
  )
}
