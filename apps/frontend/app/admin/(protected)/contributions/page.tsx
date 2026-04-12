import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
import { IconNotebook } from '@tabler/icons-react'
import { getAdminSession } from '@/lib/admin/session'
import { fetchAdminContributions } from '@/lib/admin/fetchers'
import { hasMinRole } from '@/lib/admin/rbac'
import { formatDate } from '@/lib/formatDate'
import { ContributionActions } from './ContributionActions'

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente (legacy)' },
  { value: 'approved', label: 'Publiés' },
  { value: 'suspended', label: 'Suspendus' },
  { value: 'rejected', label: 'Rejetés' },
]

export default async function AdminContributionsPage({ searchParams }: PageProps) {
  const adminSession = await getAdminSession()
  if (!adminSession || !hasMinRole(adminSession.role, 'editor')) {
    redirect('/admin')
  }

  const params = await searchParams
  const status = params.status
  const page = Number(params.page) || 1

  const { data: rows, total } = await fetchAdminContributions({
    status,
    page,
    limit: 30,
  })

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2" className="flex items-center gap-2">
          <IconNotebook className="h-7 w-7" aria-hidden />
          Tribune &amp; événements lecteurs
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} contribution{total !== 1 ? 's' : ''}
        </p>
        <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Les nouvelles publications sont <strong className="text-foreground">acceptées automatiquement</strong> et
          visibles sur la tribune. L’équipe intervient ici uniquement pour réguler : suspendre une publication (retrait
          temporaire du fil), rejeter ou supprimer en cas de problème.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <a
            key={f.value}
            href={`/admin/contributions${f.value ? `?status=${f.value}` : ''}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              (status ?? '') === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <Card key={row.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{row.author?.email ?? '—'}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                        {row.kind === 'event' ? 'Événement' : 'Tribune'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.status === 'pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : row.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : row.status === 'suspended'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {row.status === 'pending'
                          ? 'En attente'
                          : row.status === 'approved'
                            ? 'Publié'
                            : row.status === 'suspended'
                              ? 'Suspendu'
                              : 'Rejeté'}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
                    </div>
                    <h3 className="font-semibold text-foreground">{row.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{row.body}</p>
                    {row.kind === 'event' && (row.event_location || row.event_starts_at) ? (
                      <p className="text-xs text-muted-foreground">
                        {row.event_location ? `Lieu : ${row.event_location}` : ''}
                        {row.event_starts_at ? ` · ${formatDate(row.event_starts_at)}` : ''}
                      </p>
                    ) : null}
                  </div>
                  <ContributionActions id={row.id} status={row.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune contribution pour ce filtre.</p>
      )}
    </div>
  )
}
