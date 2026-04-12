import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canEditAnnouncements } from '@/lib/admin/rbac'
import { fetchAnnouncements } from '@/lib/admin/fetchers'
import { formatDateShort } from '@/lib/formatDate'
import { AnnouncementForm } from './AnnouncementForm'
import { AnnouncementRowActions } from './AnnouncementRowActions'

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Tous',
  subscribers: 'Abonnés',
  guests: 'Non abonnés',
}

export default async function ReaderAnnouncementsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canEditAnnouncements(session.role)) redirect('/admin')

  const rows = await fetchAnnouncements()

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          Annonces reader
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Bannières et messages affichés sur la plateforme reader. Chaque modification est journalisée côté API.
        </p>
      </div>

      <AnnouncementForm />

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Titre</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Audience
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Emplacement
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Fenêtre
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actif</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {AUDIENCE_LABELS[a.audience] ?? a.audience}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    <span className="text-xs">{a.placement}</span>
                    {a.priority > 0 ? (
                      <span className="ml-1 text-[10px] text-muted-foreground">· prio {a.priority}</span>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {a.starts_at || a.ends_at ? (
                      <>
                        {a.starts_at ? formatDateShort(a.starts_at) : '—'} →{' '}
                        {a.ends_at ? formatDateShort(a.ends_at) : '—'}
                      </>
                    ) : (
                      'Illimité'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {a.is_active ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AnnouncementRowActions announcement={a} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucune annonce. Créez-en une ci-dessus.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
