import Link from 'next/link'
import { Suspense } from 'react'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { getCrmIsAdmin } from '@/lib/crm-admin'
import { AdminArchiveRestoreActions } from '@/components/admin/AdminArchiveRestoreActions'
import { CrmSearchViewToolbar } from '@/components/crm/CrmSearchViewToolbar'
import { listSearchFromParams, parseListView } from '@/lib/crm-list-query'

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const isAdmin = await getCrmIsAdmin()
  const search = listSearchFromParams(sp)
  const view = parseListView(sp.view, 'list')

  const qActive = new URLSearchParams()
  qActive.set('limit', '50')
  if (search) qActive.set('search', search)

  const qArchived = new URLSearchParams(qActive)
  qArchived.set('archived', 'true')

  const activeRes = await crmGetServer<Array<Record<string, unknown>>>(`contracts?${qActive}`)
  const contracts = activeRes?.data ?? []

  const archivedRes = isAdmin
    ? await crmGetServer<Array<Record<string, unknown>>>(`contracts?${qArchived}`)
    : null
  const archivedContracts = archivedRes?.data ?? []

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          Contrats
        </Heading>
        <Link href="/contracts/new">
          <Button>Nouveau contrat</Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <CrmSearchViewToolbar basePath="/contracts" initialSearch={search ?? ''} defaultView="list" />
      </Suspense>

      {contracts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Aucun contrat.</p>
      ) : view === 'cards' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map((c) => (
            <Link
              key={c.id as string}
              href={`/contracts/${c.id}`}
              className="crm-card crm-card-interactive p-5 block"
            >
              <p className="text-xs font-mono text-muted-foreground mb-1">{String(c.reference ?? '')}</p>
              <h3 className="font-semibold text-sm line-clamp-2 mb-3">{String(c.title ?? '')}</h3>
              <div className="flex items-center justify-between">
                <span className="capitalize text-sm">{String(c.status ?? '—')}</span>
                <AdminArchiveRestoreActions
                  resource="contracts"
                  id={c.id as string}
                  isArchived={Boolean((c as Record<string, unknown>)['is_archived'])}
                  isAdmin={isAdmin}
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
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
      )}

      {isAdmin && archivedContracts.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden mt-6">
          <p className="crm-section-title px-4 pt-4 mb-3">Archivés ({archivedContracts.length})</p>
          {view === 'cards' ? (
            <div className="grid gap-3 sm:grid-cols-2 p-4 pt-0 lg:grid-cols-3">
              {archivedContracts.map((c) => (
                <Link
                  key={c.id as string}
                  href={`/contracts/${c.id}`}
                  className="crm-card crm-card-interactive p-4 block"
                >
                  <p className="text-xs font-mono text-muted-foreground mb-1">{String(c.reference ?? '')}</p>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">{String(c.title ?? '')}</h3>
                  <div className="flex items-center justify-between">
                    <span className="capitalize text-sm">{String(c.status ?? '')}</span>
                    <AdminArchiveRestoreActions
                      resource="contracts"
                      id={c.id as string}
                      isArchived={true}
                      isAdmin={isAdmin}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
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
                        isArchived={true}
                        isAdmin={isAdmin}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
