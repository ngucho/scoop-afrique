import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderOperations } from '@/lib/admin/rbac'
import { fetchNewsletterCampaigns } from '@/lib/admin/fetchers'
import { NewsletterCreateModal } from './NewsletterCreateModal'
import { NewsletterCampaignRow } from './NewsletterCampaignRow'

const CADENCE: Record<string, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
}

const STATUS: Record<string, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifiee',
  sending: 'Envoi en cours',
  sent: 'Envoyee',
  cancelled: 'Annulee',
}

export default async function ReaderNewslettersPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canManageReaderOperations(session.role)) redirect('/admin')

  const campaigns = await fetchNewsletterCampaigns()
  const drafts = campaigns.filter((c) => c.status === 'draft').length
  const scheduled = campaigns.filter((c) => c.status === 'scheduled').length
  const sent = campaigns.filter((c) => c.status === 'sent').length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Campagnes email</p>
          <Heading as="h1" level="h2" className="mt-2">
            Newsletters
          </Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            Preparez les objets, preheaders, segments et contenus HTML pour les envois specifiques hors digest automatique.
          </p>
        </div>
        <NewsletterCreateModal />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Brouillons', value: drafts },
          { label: 'Planifiees', value: scheduled },
          { label: 'Envoyees', value: sent },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune campagne. Creez une campagne pour preparer un envoi cible.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Cadence</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Statut</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Envoi prevu</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <NewsletterCampaignRow key={c.id} campaign={c} cadenceLabels={CADENCE} statusLabels={STATUS} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
