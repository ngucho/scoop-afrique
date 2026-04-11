import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { ServicesClient } from '@/components/services/ServicesClient'
import { Plus, Package } from 'lucide-react'
import { CrmSearchViewToolbar } from '@/components/crm/CrmSearchViewToolbar'
import { listSearchFromParams, parseListView } from '@/lib/crm-list-query'

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const search = listSearchFromParams(sp)
  const view = parseListView(sp.view, 'cards')

  const q = new URLSearchParams()
  q.set('limit', '100')
  if (search) q.set('search', search)

  const res = await crmGetServer<Array<Record<string, unknown>>>(`services?${q}`)
  const services = res?.data ?? []

  return (
    <div className="space-y-6 max-w-[1200px] crm-fade-in">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Catalogue des prestations</h1>
          <p className="crm-page-subtitle">{services.length} prestation{services.length !== 1 ? 's' : ''} disponible{services.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/services/new">
          <Button className="flex items-center gap-2 rounded-full px-5 font-semibold">
            <Plus className="h-4 w-4" />
            Nouvelle prestation
          </Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <CrmSearchViewToolbar basePath="/services" initialSearch={search ?? ''} defaultView="cards" />
      </Suspense>

      {services.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty py-16">
            <Package className="crm-empty-icon h-12 w-12" />
            <p className="crm-empty-title">Aucune prestation</p>
            <p className="text-sm text-muted-foreground">Créez votre catalogue de services</p>
            <Link href="/services/new">
              <Button className="mt-4 rounded-full px-5">Créer une prestation</Button>
            </Link>
          </div>
        </div>
      ) : (
        <ServicesClient initialServices={services} view={view} />
      )}
    </div>
  )
}
