import Link from 'next/link'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { AdminArchiveRestoreActions } from '@/components/admin/AdminArchiveRestoreActions'

export default async function ContractsPage() {
  const isAdmin = await getCrmIsAdmin()

  const activeRes = await crmGetServer<Array<Record<string, unknown>>>('contracts?limit=50')
  const contracts = activeRes?.data ?? []

  const archivedRes = isAdmin ? await crmGetServer<Array<Record<string, unknown>>>('contracts?limit=50&archived=true') : null
  const archivedContracts = archivedRes?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          Contrats
        </Heading>
        <Link href="/contracts/new">
          <Button>Nouveau contrat</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Référence</th>
              <th className="text-left p-3 font-medium">Titre</th>
              <th className="text-left p-3 font-medium">Statut</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id as string} className="border-t border-border hover:bg-muted/30">
                <td className="p-3">
                  <Link href={`/contracts/${c.id}`} className="font-medium hover:underline">
                    {String(c.reference ?? '—')}
                  </Link>
                </td>
                <td className="p-3">{String(c.title ?? '—')}</td>
                <td className="p-3">
                  <span className="capitalize">{String(c.status ?? '—')}</span>
                </td>
                <td className="p-3">
                  <AdminArchiveRestoreActions
                    resource="contracts"
                    id={c.id as string}
                    isArchived={Boolean((c as Record<string, unknown>)['is_archived'])}
                    isAdmin={isAdmin}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contracts.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          Aucun contrat.
        </p>
      )}

      {isAdmin && archivedContracts.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden mt-6">
          <p className="crm-section-title px-4 pt-4 mb-3">Archivés ({archivedContracts.length})</p>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Référence</th>
                <th className="text-left p-3 font-medium">Titre</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {archivedContracts.map((c) => (
                <tr key={c.id as string} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3">
                    <Link href={`/contracts/${c.id}`} className="font-medium hover:underline">
                      {String(c.reference ?? '—')}
                    </Link>
                  </td>
                  <td className="p-3">{String(c.title ?? '—')}</td>
                  <td className="p-3">
                    <span className="capitalize">{String(c.status ?? '—')}</span>
                  </td>
                  <td className="p-3">
                    <AdminArchiveRestoreActions
                      resource="contracts"
                      id={c.id as string}
                      isArchived={Boolean((c as Record<string, unknown>)['is_archived'])}
                      isAdmin={isAdmin}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
