import Link from 'next/link'
import { Heading, Badge } from 'scoop'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { fetchAdminArticles } from '@/lib/admin/fetchers'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/admin/rbac'
import { formatDateShort } from '@/lib/formatDate'
import { ArticleFilters } from './ArticleFilters'

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status
  const q = params.q
  const page = Number(params.page) || 1

  const { data: articles, total } = await fetchAdminArticles({
    status,
    q,
    page,
    limit: 25,
  })

  const totalPages = Math.ceil(total / 25)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="h1" level="h2">
            Articles
          </Heading>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} article{total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="press-effect inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <IconPlus className="h-4 w-4" />
          Nouvel article
        </Link>
      </div>

      {/* Filters */}
      <ArticleFilters currentStatus={status} currentQuery={q} />

      {/* Table */}
      {articles.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Titre
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Statut
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Auteur
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Vues
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {article.category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[article.status] ?? ''
                      }`}
                    >
                      {STATUS_LABELS[article.status] ?? article.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {article.author?.email ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {formatDateShort(article.published_at ?? article.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {(article.view_count ?? 0).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <IconSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucun article trouvé.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const sp = new URLSearchParams()
            if (status) sp.set('status', status)
            if (q) sp.set('q', q)
            sp.set('page', String(p))
            return (
              <Link
                key={p}
                href={`/admin/articles?${sp.toString()}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {p}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
