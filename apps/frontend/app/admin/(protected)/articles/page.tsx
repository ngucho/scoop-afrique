import Link from 'next/link'
import { Heading } from 'scoop'
import { IconChevronLeft, IconChevronRight, IconEdit, IconEye, IconFileUpload, IconPlus, IconSearch } from '@tabler/icons-react'
import { fetchAdminArticles } from '@/lib/admin/fetchers'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/admin/rbac'
import { formatDateShort } from '@/lib/formatDate'
import { buildPaginationItems } from '@/lib/adminPagination'
import { ArticleFilters } from './ArticleFilters'

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}

const PAGE_SIZE = 25

function articlesHref(params: { status?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams()
  if (params.status) sp.set('status', params.status)
  if (params.q) sp.set('q', params.q)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  const qs = sp.toString()
  return `/admin/articles${qs ? `?${qs}` : ''}`
}

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status
  const q = params.q
  const page = Math.max(1, Number(params.page) || 1)

  const { data: articles, total } = await fetchAdminArticles({
    status,
    q,
    page,
    limit: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)
  const paginationItems = buildPaginationItems(page, totalPages)
  const activeStatusLabel = status ? STATUS_LABELS[status] ?? status : 'Tous les statuts'

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Contenus
            </p>
            <Heading as="h1" level="h2" className="mt-2">
              Articles
            </Heading>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Pilote les brouillons, validations, publications et performances sans quitter la liste.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/articles/import"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-foreground hover:border-primary hover:text-primary"
            >
              <IconFileUpload className="h-4 w-4" />
              Import JSON
            </Link>
            <Link
              href="/admin/articles/new"
              className="press-effect inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-primary-foreground hover:bg-primary/90"
            >
              <IconPlus className="h-4 w-4" />
              Nouvel article
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1rem] border border-border bg-background p-4">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Resultats</p>
            <p className="mt-2 text-2xl font-black">{total.toLocaleString('fr-FR')}</p>
          </div>
          <div className="rounded-[1rem] border border-border bg-background p-4">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Statut</p>
            <p className="mt-2 truncate text-sm font-bold">{activeStatusLabel}</p>
          </div>
          <div className="rounded-[1rem] border border-border bg-background p-4">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Page</p>
            <p className="mt-2 text-sm font-bold">{totalPages > 0 ? `${page} / ${totalPages}` : 'Aucune'}</p>
          </div>
        </div>
      </section>

      <ArticleFilters currentStatus={status} currentQuery={q} />

      <div className="overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs font-bold text-muted-foreground">
            {start.toLocaleString('fr-FR')} - {end.toLocaleString('fr-FR')} sur {total.toLocaleString('fr-FR')}
          </p>
          {q || status ? (
            <Link href="/admin/articles" className="font-sans text-xs font-black uppercase tracking-[0.1em] text-primary">
              Reinitialiser
            </Link>
          ) : null}
        </div>

        {articles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/35">
                  <th className="px-4 py-3 text-left font-sans text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Article</th>
                  <th className="px-4 py-3 text-left font-sans text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left font-sans text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Rubrique</th>
                  <th className="px-4 py-3 text-left font-sans text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Auteur</th>
                  <th className="px-4 py-3 text-right font-sans text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Vues</th>
                  <th className="px-4 py-3 text-left font-sans text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-sans text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/25">
                    <td className="max-w-[360px] px-4 py-3">
                      <Link href={`/admin/articles/${article.id}/edit`} className="line-clamp-1 font-semibold text-foreground hover:text-primary">
                        {article.title}
                      </Link>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{article.excerpt ?? article.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[article.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {STATUS_LABELS[article.status] ?? article.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{article.category?.name ?? 'Sans rubrique'}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                      {article.author_display_name ?? article.author?.email ?? 'Non assigne'}
                    </td>
                    <td className="px-4 py-3 text-right font-sans font-black tabular-nums">{(article.view_count ?? 0).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateShort(article.published_at ?? article.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {article.status === 'published' ? (
                          <Link
                            href={`/articles/${article.slug}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                            aria-label={`Voir ${article.title}`}
                          >
                            <IconEye className="h-4 w-4" />
                          </Link>
                        ) : null}
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          aria-label={`Modifier ${article.title}`}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <IconSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">Aucun article trouve.</p>
            <p className="mt-1 text-sm text-muted-foreground">Change le statut, efface la recherche ou cree un nouvel article.</p>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination des articles admin">
          <Link
            href={articlesHref({ status, q, page: Math.max(1, page - 1) })}
            aria-disabled={page <= 1}
            className={`inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 font-sans text-xs font-black uppercase tracking-[0.1em] ${
              page <= 1 ? 'pointer-events-none opacity-45' : 'hover:border-primary hover:text-primary'
            }`}
          >
            <IconChevronLeft className="h-4 w-4" />
            Avant
          </Link>
          {paginationItems.map((item) =>
            item.type === 'ellipsis' ? (
              <span key={item.key} className="px-2 text-sm text-muted-foreground">...</span>
            ) : (
              <Link
                key={item.page}
                href={articlesHref({ status, q, page: item.page })}
                aria-current={item.isCurrent ? 'page' : undefined}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-sans text-sm font-black ${
                  item.isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {item.page}
              </Link>
            )
          )}
          <Link
            href={articlesHref({ status, q, page: Math.min(totalPages, page + 1) })}
            aria-disabled={page >= totalPages}
            className={`inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 font-sans text-xs font-black uppercase tracking-[0.1em] ${
              page >= totalPages ? 'pointer-events-none opacity-45' : 'hover:border-primary hover:text-primary'
            }`}
          >
            Suite
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      ) : null}
    </div>
  )
}
