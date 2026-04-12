import { redirect } from 'next/navigation'
import { Heading } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canViewReaderInsights } from '@/lib/admin/rbac'
import { fetchAudienceMetricsLatest, fetchAudienceMetricsRecent } from '@/lib/admin/fetchers'
import { AudienceMetricsClient } from './AudienceMetricsClient'

export default async function AudienceMetricsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canViewReaderInsights(session.role)) redirect('/admin')

  const [recent, latest] = await Promise.all([
    fetchAudienceMetricsRecent({ days: 90, limit: 500 }),
    fetchAudienceMetricsLatest(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          KPI &amp; audience (séries temporelles)
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisie manuelle ou jobs d’ingestion vers la table <span className="font-mono text-xs">audience_metric_snapshots</span>
          . Lecture réservée au back-office (éditeur+) ; même rôle peut poster un point.
        </p>
      </div>
      <AudienceMetricsClient recent={recent} latest={latest} userRole={session.role} />
    </div>
  )
}
