import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heading, Card, CardContent } from 'scoop'
import { IconMessages } from '@tabler/icons-react'
import { getAdminSession } from '@/lib/admin/session'
import { fetchAdminComments } from '@/lib/admin/fetchers'
import { hasMinRole } from '@/lib/admin/rbac'
import { formatDate } from '@/lib/formatDate'
import { CommentActions } from './CommentActions'

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuves' },
  { value: 'rejected', label: 'Rejetes' },
]

function statusLabel(status: string): string {
  if (status === 'pending') return 'En attente'
  if (status === 'approved') return 'Approuve'
  return 'Rejete'
}

function pageHref(status: string | undefined, page: number): string {
  const sp = new URLSearchParams()
  if (status) sp.set('status', status)
  sp.set('page', String(page))
  return `/admin/comments?${sp.toString()}`
}

export default async function AdminCommentsPage({ searchParams }: PageProps) {
  const adminSession = await getAdminSession()
  if (!adminSession || !hasMinRole(adminSession.role, 'editor')) {
    redirect('/admin')
  }

  const params = await searchParams
  const status = params.status
  const page = Math.max(Number(params.page) || 1, 1)

  const [{ data: comments, total }, pending, approved, rejected] = await Promise.all([
    fetchAdminComments({ status, page, limit: 30 }),
    fetchAdminComments({ status: 'pending', limit: 1 }),
    fetchAdminComments({ status: 'approved', limit: 1 }),
    fetchAdminComments({ status: 'rejected', limit: 1 }),
  ])

  const prev = page > 1 ? pageHref(status, page - 1) : null
  const next = page * 30 < total ? pageHref(status, page + 1) : null

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Conversation reader</p>
        <Heading as="h1" level="h2" className="mt-2">
          Moderation des commentaires
        </Heading>
        <p className="mt-2 text-sm text-muted-foreground">
          Traitez les commentaires en attente, gardez l&apos;historique visible et evitez les files invisibles.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'En attente', value: pending.total },
          { label: 'Approuves', value: approved.total },
          { label: 'Rejetes', value: rejected.total },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/comments${f.value ? `?status=${f.value}` : ''}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              (status ?? '') === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{comment.author?.email ?? 'Anonyme'}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          comment.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : comment.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {statusLabel(comment.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-sm leading-6 text-foreground">{comment.body}</p>
                  </div>
                  <CommentActions commentId={comment.id} status={comment.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <IconMessages className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucun commentaire trouve.</p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {page} - {comments.length} lignes sur {total}
        </span>
        <div className="flex gap-3">
          {prev ? <Link href={prev} className="text-primary hover:underline">Precedent</Link> : <span className="text-muted-foreground">Precedent</span>}
          {next ? <Link href={next} className="text-primary hover:underline">Suivant</Link> : <span className="text-muted-foreground">Suivant</span>}
        </div>
      </div>
    </div>
  )
}
