import { crmGetServer } from '@/lib/api-server'
import { ActivityClient } from '@/components/activity/ActivityClient'
import { Activity } from 'lucide-react'

export default async function ActivityPage() {
  const res = await crmGetServer<Array<Record<string, unknown>>>('activity?limit=200')
  const activity = res?.data ?? []

  return (
    <div className="space-y-6 max-w-[900px] crm-fade-in">
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Journal d&apos;activité</h1>
          <p className="crm-page-subtitle">
            {activity.length} événement{activity.length !== 1 ? 's' : ''} enregistré{activity.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'var(--primary-subtle)' }}
        >
          <Activity className="h-5 w-5" style={{ color: 'var(--primary)' }} strokeWidth={1.8} />
        </div>
      </div>

      <ActivityClient initialActivity={activity} />
    </div>
  )
}
