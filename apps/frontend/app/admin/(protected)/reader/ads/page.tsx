import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderOperations } from '@/lib/admin/rbac'
import { fetchAdSlots, fetchAdCampaigns } from '@/lib/admin/fetchers'
import { AdCampaignForm } from './AdCampaignForm'
import { CampaignCard } from './CampaignCard'

const STATUS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  paused: 'Pause',
  ended: 'Terminé',
}

export default async function ReaderAdsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canManageReaderOperations(session.role)) redirect('/admin')

  const [slots, campaigns] = await Promise.all([fetchAdSlots(), fetchAdCampaigns()])

  return (
    <div className="space-y-8">
      <div>
        <Heading as="h1" level="h2">
          Publicité — emplacements & campagnes
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Emplacements prédéfinis, campagnes avec pondération et créatives. Les clics et impressions alimentent le CTR du
          tableau de bord.
        </p>
      </div>

      <section>
        <Heading as="h2" level="h4" className="mb-3">
          Emplacements
        </Heading>
        <div className="grid gap-3 sm:grid-cols-3">
          {slots.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <p className="font-mono text-xs text-muted-foreground">{s.key}</p>
                <p className="font-semibold">{s.label}</p>
                {s.description && <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <AdCampaignForm slots={slots} />

      <section>
        <Heading as="h2" level="h4" className="mb-3">
          Campagnes
        </Heading>
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aucune campagne. Créez-en une ci-dessus.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} slots={slots} statusLabels={STATUS} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
