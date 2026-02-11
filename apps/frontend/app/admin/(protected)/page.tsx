import Link from 'next/link'
import { Heading, Card, CardContent } from 'scoop'
import { formatDateShort } from '@/lib/formatDate'
import {
  IconFileText,
  IconEye,
  IconMessages,
  IconClock,
  IconPlus,
  IconArrowRight,
  IconAlertCircle,
  IconTrendingUp,
} from '@tabler/icons-react'
import { getAdminSession } from '@/lib/admin/session'
import { fetchDashboardStats, fetchAdminArticles } from '@/lib/admin/fetchers'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  hasMinRole,
  type AppRole,
} from '@/lib/admin/rbac'

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  accent?: string
}) {
  const card = (
    <Card className={`hover-lift transition-shadow hover:shadow-md ${href ? 'cursor-pointer' : ''}`}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-lg p-2.5 ${accent ?? 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{card}</Link> : card
}

export default async function AdminDashboardPage() {
  const [adminSession, stats, recentArticles] = await Promise.all([
    getAdminSession(),
    fetchDashboardStats(),
    fetchAdminArticles({ limit: 5 }),
  ])

  const role: AppRole = adminSession?.role ?? 'journalist'
  const greetingName =
    adminSession?.metadata?.name?.split(' ')[0] ??
    adminSession?.name?.split(' ')[0] ??
    adminSession?.email?.split('@')[0] ??
    'Utilisateur'

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="h1" level="h2">
            Bonjour, {greetingName}
          </Heading>
          <p className="mt-1 text-muted-foreground">
            {role === 'journalist' && "Voici l'état de vos articles."}
            {role === 'editor' && 'Voici la file de révision et votre équipe.'}
            {role === 'manager' && "Vue d'ensemble du pipeline éditorial."}
            {role === 'admin' && 'Tableau de bord système complet.'}
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="press-effect inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <IconPlus className="h-4 w-4" />
          Nouvel article
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: '0.1s' }}>
        <StatCard
          label="Articles publiés"
          value={stats.published}
          icon={IconFileText}
          href="/admin/articles?status=published"
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        />
        <StatCard
          label="Brouillons"
          value={stats.drafts}
          icon={IconClock}
          href="/admin/articles?status=draft"
        />
        <StatCard
          label="En révision"
          value={stats.inReview}
          icon={IconEye}
          href="/admin/articles?status=review"
          accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        {hasMinRole(role, 'editor') ? (
          <StatCard
            label="Commentaires en attente"
            value={stats.pendingComments}
            icon={IconMessages}
            href="/admin/comments?status=pending"
            accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          />
        ) : (
          <StatCard
            label="Total articles"
            value={stats.totalArticles}
            icon={IconTrendingUp}
            href="/admin/articles"
          />
        )}
      </div>

      {/* Alert for pending reviews (editors+) */}
      {hasMinRole(role, 'editor') && stats.inReview > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
          <IconAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {stats.inReview} article{stats.inReview > 1 ? 's' : ''} en attente de
              révision
            </p>
            <Link
              href="/admin/articles?status=review"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
            >
              Voir la file de révision
              <IconArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Recent articles */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Heading as="h2" level="h4">
            Articles récents
          </Heading>
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir tout
          </Link>
        </div>

        {recentArticles.data.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Titre
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    Statut
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Vues
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentArticles.data.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="font-medium hover:text-primary"
                      >
                        {article.title}
                      </Link>
                      {article.category && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {article.category.name}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[article.status] ?? ''
                        }`}
                      >
                        {STATUS_LABELS[article.status] ?? article.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatDateShort(article.published_at ?? article.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {article.view_count?.toLocaleString('fr-FR') ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <IconFileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucun article pour le moment.</p>
              <Link
                href="/admin/articles/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <IconPlus className="h-4 w-4" />
                Créer votre premier article
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
