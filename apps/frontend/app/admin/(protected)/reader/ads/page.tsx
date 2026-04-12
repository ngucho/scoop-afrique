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
  ended: 'Terminé',
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Heading as="h1" level="h2">
            Publicité — emplacements & campagnes
          </Heading>
          <p className="mt-1 text-sm text-muted-foreground">
            Emplacements prédéfinis, campagnes avec pondération et créatives (image, native, vidéo). Les impressions et
            clics sont agrégés par emplacement pour le CTR et le reporting.
          </p>
        </div>
        <AdCampaignCreateModal slots={slots} />
      </div>

      {metrics ? (
        <section>
          <Heading as="h2" level="h4" className="mb-3">
            Métriques ({metrics.days} j.)
          </Heading>
          <Card>
            <CardContent className="p-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Total : {metrics.totals.impressions.toLocaleString('fr-FR')} impressions,{' '}
                {metrics.totals.clicks.toLocaleString('fr-FR')} clics
                {metrics.totals.ctr != null ? (
                  <>
                    {' '}
                    — CTR {(metrics.totals.ctr * 100).toFixed(2)} %
                  </>
                ) : null}
              </p>
              <AdminTable
                columns={[
                  { label: 'Emplacement', align: 'left' },
                  { label: 'Impressions', align: 'right' },
                  { label: 'Clics', align: 'right' },
                  { label: 'CTR', align: 'right' },
                ]}
                rows={metrics.by_slot.map((r) => [
                  <span className="font-mono text-xs">{r.slot_key}</span>,
                  r.impressions.toLocaleString('fr-FR'),
                  r.clicks.toLocaleString('fr-FR'),
                  r.ctr != null ? `${(r.ctr * 100).toFixed(2)} %` : '—',
                ])}
                emptyMessage="Aucune donnée sur la période."
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section>
        <Heading as="h2" level="h4" className="mb-3">
          Emplacements (inventaire)
        </Heading>
        <p className="mb-3 text-sm text-muted-foreground">
          Chaque <span className="font-mono text-xs">key</span> correspond à un emplacement dans le code reader (ex.{' '}
          <span className="font-mono text-xs">GLOBAL_TOP_BANNER</span>, <span className="font-mono text-xs">ARTICLE_MID</span>
          ). Une campagne active avec créatives valides peut être diffusée sur plusieurs pages : accueil, listes, article,
          etc.
        </p>
        <Card>
          <CardContent className="p-4">
            <AdminTable
              columns={[
                { label: 'Clé', align: 'left' },
                { label: 'Libellé', align: 'left' },
                { label: 'Description', align: 'left' },
              ]}
              rows={slots.map((s) => [
                <span className="font-mono text-xs">{s.key}</span>,
                s.label,
                s.description ?? '—',
              ])}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <Heading as="h2" level="h4" className="mb-3">
          Campagnes
        </Heading>
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aucune campagne. Utilisez « Nouvelle campagne ».
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
