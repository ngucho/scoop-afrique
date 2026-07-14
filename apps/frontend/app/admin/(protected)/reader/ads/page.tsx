import { redirect } from 'next/navigation'
import { Heading, Card, CardContent, AdminTable } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderOperations } from '@/lib/admin/rbac'
import { fetchAdSlots, fetchAdCampaigns, fetchAdMetrics } from '@/lib/admin/fetchers'
import { AdCampaignCreateModal } from './AdCampaignCreateModal'
import { CampaignCard } from './CampaignCard'

const STATUS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  paused: 'Pause',
  ended: 'Termine',
}

function pct(value: number | null): string {
  return value == null ? '-' : `${(value * 100).toFixed(2)} %`
}

export default async function ReaderAdsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canManageReaderOperations(session.role)) redirect('/admin')

  const [slots, campaigns, metrics] = await Promise.all([
    fetchAdSlots(),
    fetchAdCampaigns(),
    fetchAdMetrics(30),
  ])

  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length
  const creatives = campaigns.reduce((sum, c) => sum + c.creatives.length, 0)
  const bestSlot = metrics?.by_slot
    .filter((slot) => slot.ctr != null)
    .sort((a, b) => (b.ctr ?? 0) - (a.ctr ?? 0))[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Monetisation reader</p>
          <Heading as="h1" level="h2" className="mt-2">
            Publicites
          </Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            Gere les emplacements, les campagnes et les creatives avec une lecture claire des performances par slot.
          </p>
        </div>
        <AdCampaignCreateModal slots={slots} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Campagnes actives', value: activeCampaigns.toLocaleString('fr-FR') },
          { label: 'Creatives', value: creatives.toLocaleString('fr-FR') },
          { label: 'Impressions 30j', value: (metrics?.totals.impressions ?? 0).toLocaleString('fr-FR') },
          { label: 'CTR global', value: pct(metrics?.totals.ctr ?? null) },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {metrics ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <Heading as="h2" level="h4">
                    Performance par emplacement
                  </Heading>
                  <p className="mt-1 text-sm text-muted-foreground">{metrics.days} derniers jours</p>
                </div>
              </div>
              <AdminTable
                columns={[
                  { label: 'Emplacement', align: 'left' },
                  { label: 'Impressions', align: 'right' },
                  { label: 'Clics', align: 'right' },
                  { label: 'CTR', align: 'right' },
                ]}
                rows={metrics.by_slot.map((r) => [
                  <span key="slot" className="font-mono text-xs">{r.slot_key}</span>,
                  r.impressions.toLocaleString('fr-FR'),
                  r.clicks.toLocaleString('fr-FR'),
                  pct(r.ctr),
                ])}
                emptyMessage="Aucune donnee sur la periode."
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Signal utile</p>
              <p className="mt-3 text-lg font-bold">{bestSlot?.slot_key ?? 'Pas assez de donnees'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {bestSlot
                  ? `Meilleur CTR observe: ${pct(bestSlot.ctr)} avec ${bestSlot.clicks.toLocaleString('fr-FR')} clics.`
                  : 'Ajoutez des campagnes actives pour commencer a comparer les emplacements.'}
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Heading as="h2" level="h4">
            Campagnes
          </Heading>
          <span className="text-sm text-muted-foreground">{campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}</span>
        </div>
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aucune campagne. Creez une premiere campagne pour alimenter les emplacements reader.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} slots={slots} statusLabels={STATUS} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Heading as="h2" level="h4">
          Inventaire technique
        </Heading>
        <Card>
          <CardContent className="p-4">
            <AdminTable
              columns={[
                { label: 'Cle', align: 'left' },
                { label: 'Libelle', align: 'left' },
                { label: 'Description', align: 'left' },
              ]}
              rows={slots.map((s) => [
                <span key="key" className="font-mono text-xs">{s.key}</span>,
                s.label,
                s.description ?? '-',
              ])}
              emptyMessage="Aucun emplacement configure."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
