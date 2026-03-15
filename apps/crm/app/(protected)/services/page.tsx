import Link from 'next/link'
import { Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { ServicesClient } from '@/components/services/ServicesClient'
import { Plus, Package } from 'lucide-react'

export default async function ServicesPage() {
  const res = await crmGetServer<Array<Record<string, unknown>>>('services?limit=100')
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
        <ServicesClient initialServices={services} />
      )}
    </div>
  )
}
