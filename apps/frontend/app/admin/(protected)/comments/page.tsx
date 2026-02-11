import { redirect } from 'next/navigation'
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
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Rejetés' },
]

export default async function AdminCommentsPage({ searchParams }: PageProps) {
  const adminSession = await getAdminSession()
  if (!adminSession || !hasMinRole(adminSession.role, 'editor')) {
    redirect('/admin')
  }

  const params = await searchParams
  const status = params.status
  const page = Number(params.page) || 1

  const { data: comments, total } = await fetchAdminComments({
    status,
    page,
    limit: 30,
  })

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          Modération des commentaires
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} commentaire{total !== 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <a
            key={f.value}
            href={`/admin/comments${f.value ? `?status=${f.value}` : ''}`}
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

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment, i) => (
            <Card key={comment.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.author?.email ?? 'Anonyme'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          comment.status === 'pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : comment.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {comment.status === 'pending'
                          ? 'En attente'
                          : comment.status === 'approved'
                          ? 'Approuvé'
                          : 'Rejeté'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.body}</p>
                  </div>
                  <CommentActions commentId={comment.id} status={comment.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <IconMessages className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucun commentaire trouvé.</p>
        </div>
      )}
    </div>
  )
}
