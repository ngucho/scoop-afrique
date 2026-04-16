import { redirect } from 'next/navigation'
import { Heading } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canSendWeeklyNewsletterDigest } from '@/lib/admin/rbac'
import { WeeklyDigestClient } from './WeeklyDigestClient'

export default async function WeeklyDigestPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canSendWeeklyNewsletterDigest(session.role)) redirect('/admin')

  return (
    <div className="space-y-8">
      <div>
        <Heading as="h1" level="h2">
          Digest hebdomadaire (mailing-list)
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Génération et envoi du sélectionné du samedi (ou à la demande) vers les abonnés newsletter confirmés.
          Accessible aux rôles <strong className="font-medium text-foreground">éditeur</strong>,{' '}
          <strong className="font-medium text-foreground">manager</strong> et{' '}
          <strong className="font-medium text-foreground">admin</strong>. Prévoir une automatisation externe
          (cron) qui appelle l’API d’envoi le samedi si vous voulez un déclenchement sans action manuelle.
        </p>
      </div>
      <WeeklyDigestClient />
    </div>
  )
}
