import { redirect } from 'next/navigation'
import { Heading } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canSendWeeklyNewsletterDigest } from '@/lib/admin/rbac'
import { WeeklyDigestClient } from './WeeklyDigestClient'

const AUTOMATIONS = [
  { label: 'Vendredi apres-midi', schedule: '14:00 UTC', detail: 'Digest automatique de fin de semaine' },
  { label: 'Samedi matin', schedule: '08:00 UTC', detail: 'Rattrapage automatique du week-end' },
]

export default async function WeeklyDigestPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canSendWeeklyNewsletterDigest(session.role)) redirect('/admin')

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Newsletter automatique</p>
        <Heading as="h1" level="h2" className="mt-2">
          Digest hebdomadaire
        </Heading>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          La selection part automatiquement via Vercel Cron le vendredi apres-midi et le samedi matin. L&apos;envoi manuel reste
          disponible pour simuler, verifier la selection et declencher une campagne hors planning.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {AUTOMATIONS.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{item.schedule}</span>
            </div>
          </div>
        ))}
      </div>

      <WeeklyDigestClient />
    </div>
  )
}
