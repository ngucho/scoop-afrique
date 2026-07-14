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
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Audience & croissance</p>
        <Heading as="h1" level="h2" className="mt-2">
          KPI audience
        </Heading>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Suivez les signaux reader, social et site sur 90 jours. La saisie manuelle reste disponible, et les jobs
          d&apos;ingestion alimentent les series temporelles.
        </p>
      </div>
      <AudienceMetricsClient recent={recent} latest={latest} userRole={session.role} />
    </div>
  )
}
