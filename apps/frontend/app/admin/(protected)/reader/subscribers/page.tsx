import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heading, Card, CardContent, Input } from 'scoop'
import { getAdminSession } from '@/lib/admin/session'
import { canManageReaderOperations } from '@/lib/admin/rbac'
import { fetchSubscribers } from '@/lib/admin/fetchers'
import { formatDateShort } from '@/lib/formatDate'
import { SubscriberRow } from './SubscriberRow'
import { PendingRelaunchButton } from './PendingRelaunchButton'

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirme',
  unsubscribed: 'Desinscrit',
}

function pageHref(base: URLSearchParams, page: number): string {
  const next = new URLSearchParams(base)
  next.set('page', String(page))
  return `?${next.toString()}`
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
  const page = Math.max(Number(sp.page) || 1, 1)
  const [{ data, total }, confirmed, pendingCount, unsubscribed] = await Promise.all([
    fetchSubscribers({
      status: sp.status,
      tag: sp.tag,
      q: sp.q,
      page,
    }),
    fetchSubscribers({ status: 'confirmed', limit: 1 }),
    fetchSubscribers({ status: 'pending', limit: 1 }),
    fetchSubscribers({ status: 'unsubscribed', limit: 1 }),
  ])

  const q = new URLSearchParams()
  if (sp.status) q.set('status', sp.status)
  if (sp.tag) q.set('tag', sp.tag)
  if (sp.q) q.set('q', sp.q)

  const prev = page > 1 ? pageHref(q, page - 1) : null
  const next = page * 50 < total ? pageHref(q, page + 1) : null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Audience email</p>
          <Heading as="h1" level="h2" className="mt-2">
            Abonnes newsletter
          </Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilotez confirmations, segments et recherche email depuis une vue lisible sur mobile comme sur desktop.
          </p>
        </div>
        <PendingRelaunchButton pendingTotal={pendingCount.total} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Confirmes', value: confirmed.total, href: '?status=confirmed' },
          { label: 'En attente', value: pendingCount.total, href: '?status=pending' },
          { label: 'Desinscrits', value: unsubscribed.total, href: '?status=unsubscribed' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-xl border border-border bg-background p-4 transition hover:border-primary/40 hover:bg-primary/5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
          </Link>
        ))}
      </div>

      <form
        action="/admin/reader/subscribers"
        method="get"
        className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-[180px_180px_1fr_auto] md:items-end"
      >
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Statut</label>
          <select
            name="status"
            defaultValue={sp.status ?? ''}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tous</option>
            <option value="confirmed">Confirme</option>
            <option value="pending">En attente</option>
            <option value="unsubscribed">Desinscrit</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Segment</label>
          <Input name="tag" defaultValue={sp.tag ?? ''} placeholder="politique" className="h-10" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Recherche email</label>
          <Input name="q" defaultValue={sp.q ?? ''} placeholder="nom@domaine.com" className="h-10" />
        </div>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Rechercher
        </button>
      </form>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun resultat pour ces filtres.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {data.map((row) => (
              <Card key={row.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Inscrit le {formatDateShort(row.subscribed_at)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.segment_tags?.length ? row.segment_tags.join(', ') : 'Aucun segment'}
                  </p>
                  <SubscriberRow subscriber={row} />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Segments</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Inscrit</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="max-w-[320px] truncate px-4 py-3 font-medium">{row.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.segment_tags?.length ? row.segment_tags.join(', ') : '-'}
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
              Page {page} - {data.length} lignes sur {total}
            </span>
            <div className="flex gap-3">
              {prev ? (
                <Link href={prev} className="text-primary hover:underline">
                  Precedent
                </Link>
              ) : (
                <span className="text-muted-foreground">Precedent</span>
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
