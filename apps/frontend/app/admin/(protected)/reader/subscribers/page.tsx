import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heading, Card, CardContent, Input } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderOperations } from '@/lib/admin/rbac'
import { fetchSubscribers } from '@/lib/admin/fetchers'
import { formatDateShort } from '@/lib/formatDate'
import { SubscriberRow } from './SubscriberRow'

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  unsubscribed: 'Désinscrit',
}

export default async function ReaderSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tag?: string; q?: string; page?: string }>
}) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!canManageReaderOperations(session.role)) redirect('/admin')

  const sp = await searchParams
  const page = Number(sp.page) || 1
  const { data, total } = await fetchSubscribers({
    status: sp.status,
    tag: sp.tag,
    q: sp.q,
    page,
  })

  const q = new URLSearchParams()
  if (sp.status) q.set('status', sp.status)
  if (sp.tag) q.set('tag', sp.tag)
  if (sp.q) q.set('q', sp.q)

  const prev = page > 1 ? `?${new URLSearchParams({ ...Object.fromEntries(q), page: String(page - 1) }).toString()}` : null
  const next =
    page * 50 < total
      ? `?${new URLSearchParams({ ...Object.fromEntries(q), page: String(page + 1) }).toString()}`
      : null

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          Abonnés newsletter
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} contact{total !== 1 ? 's' : ''} — filtres par statut, segment (tag) et recherche email. Les changements
          de segments demandent une raison (audit).
        </p>
      </div>

      <form
        action="/admin/reader/subscribers"
        method="get"
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Statut</label>
          <select
            name="status"
            defaultValue={sp.status ?? ''}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tous</option>
            <option value="confirmed">Confirmé</option>
            <option value="pending">En attente</option>
            <option value="unsubscribed">Désinscrit</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tag segment</label>
          <Input name="tag" defaultValue={sp.tag ?? ''} placeholder="ex. politics" className="h-10" />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Recherche email</label>
          <Input name="q" defaultValue={sp.q ?? ''} placeholder="email…" className="h-10" />
        </div>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filtrer
        </button>
      </form>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun résultat pour ces filtres.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Segments
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                    Inscrit
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {row.segment_tags?.length ? row.segment_tags.join(', ') : '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatDateShort(row.subscribed_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <SubscriberRow subscriber={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page} — {data.length} lignes
            </span>
            <div className="flex gap-3">
              {prev ? (
                <Link href={prev} className="text-primary hover:underline">
                  Précédent
                </Link>
              ) : (
                <span className="text-muted-foreground">Précédent</span>
              )}
              {next ? (
                <Link href={next} className="text-primary hover:underline">
                  Suivant
                </Link>
              ) : (
                <span className="text-muted-foreground">Suivant</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
