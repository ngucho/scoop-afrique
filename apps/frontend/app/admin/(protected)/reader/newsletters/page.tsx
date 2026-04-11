import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderOperations } from '@/lib/admin/rbac'
import { fetchNewsletterCampaigns } from '@/lib/admin/fetchers'
import { NewsletterCampaignForm } from './NewsletterCampaignForm'
import { NewsletterCampaignRow } from './NewsletterCampaignRow'

const CADENCE: Record<string, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
}

const STATUS: Record<string, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifiée',
  sending: 'Envoi en cours',
  sent: 'Envoyée',
  cancelled: 'Annulée',
}

export default async function ReaderNewslettersPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canManageReaderOperations(session.role)) redirect('/admin')

  const campaigns = await fetchNewsletterCampaigns()

  return (
    <div className="space-y-8">
      <div>
        <Heading as="h1" level="h2">
          Campagnes newsletter
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Objet, pré-en-tête (preheader), corps en HTML (éditeur sur la fiche campagne), segments JSON et planification.
          Accès <strong className="font-medium text-foreground">manager</strong> et{' '}
          <strong className="font-medium text-foreground">admin</strong> uniquement.
        </p>
      </div>

      <NewsletterCampaignForm />

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune campagne. Créez un modèle ci-dessus.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Cadence
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Statut
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Envoi prévu
                </th>
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
