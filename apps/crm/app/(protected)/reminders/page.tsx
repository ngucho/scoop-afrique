import { Suspense } from 'react'
import { crmGetServer } from '@/lib/api-server'
import { RemindersClient } from '@/components/reminders/RemindersClient'

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const q = new URLSearchParams()
  q.set('limit', '100')
  if (sp.status) q.set('status', sp.status)

  const [remindersRes, contactsRes] = await Promise.all([
    crmGetServer<Array<Record<string, unknown>>>(`reminders?${q.toString()}`),
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
  ])

  const reminders = remindersRes?.data ?? []
  const total = remindersRes?.total ?? reminders.length
  const counts = remindersRes?.counts ?? {}
  const contacts = (contactsRes?.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: c.first_name as string,
    last_name: c.last_name as string,
  }))

  return (
    <div className="space-y-6">
      <div className="crm-page-header max-w-[1200px]">
        <div>
          <h1 className="crm-page-title">Relances</h1>
          <p className="crm-page-subtitle">Suivi des relances clients et statuts</p>
        </div>
      </div>

      <Suspense fallback={<div className="crm-card p-8 text-muted-foreground">Chargement…</div>}>
        <RemindersClient
          initialReminders={reminders}
          initialTotal={total}
          initialCounts={counts}
          contacts={contacts}
        />
      </Suspense>
    </div>
  )
}
