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
  IconUsers,
  IconClick,
  IconChartBar,
  IconCategory,
} from '@tabler/icons-react'
import { getAdminSession } from '@/lib/admin/session'
import { fetchDashboardStats, fetchAdminArticles, fetchReaderKpis } from '@/lib/admin/fetchers'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  hasMinRole,
  canViewReaderInsights,
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
  const [adminSession, stats, recentArticles, readerKpis] = await Promise.all([
    getAdminSession(),
    fetchDashboardStats(),
    fetchAdminArticles({ limit: 5 }),
    fetchReaderKpis(),
  ])

  const role: AppRole = adminSession?.role ?? 'journalist'
  const showReaderKpis = canViewReaderInsights(role) && readerKpis
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

      {/* Reader platform KPIs (editor+) */}
      {showReaderKpis && readerKpis && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Heading as="h2" level="h4">
                Reader & engagement
              </Heading>
              <p className="text-xs text-muted-foreground">
                Abonnés newsletter, CTR publicitaire (30 j.), catégories et articles les plus lus.
              </p>
            </div>
            <Link
              href="/admin/reader/subscribers"
              className="text-sm font-medium text-primary hover:underline"
            >
              Gérer les abonnés
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Abonnés confirmés"
              value={readerKpis.newsletterTotals.confirmed}
              icon={IconUsers}
              href="/admin/reader/subscribers?status=confirmed"
              accent="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
            />
            <StatCard
              label="En attente (double opt-in)"
              value={readerKpis.newsletterTotals.pending}
              icon={IconClock}
              href="/admin/reader/subscribers?status=pending"
            />
            <StatCard
              label="Désinscriptions"
              value={readerKpis.newsletterTotals.unsubscribed}
              icon={IconMessages}
              href="/admin/reader/subscribers?status=unsubscribed"
            />
            <StatCard
              label="Emplacements ads (CTR moy.)"
              value={(() => {
                const withCtr = readerKpis.adCtrBySlot.filter((x) => x.ctr != null)
                if (withCtr.length === 0) return '—'
                const avg =
                  withCtr.reduce((s, x) => s + (x.ctr ?? 0), 0) / withCtr.length
                return avg.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 })
              })()}
              icon={IconClick}
              href="/admin/reader/ads"
              accent="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <IconChartBar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">CTR par emplacement (30 j.)</span>
                </div>
                {readerKpis.adCtrBySlot.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun événement — les impressions/clics sont enregistrés côté reader.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="py-2 pr-2">Slot</th>
                          <th className="py-2 pr-2 tabular-nums">Impr.</th>
                          <th className="py-2 pr-2 tabular-nums">Clics</th>
                          <th className="py-2 tabular-nums">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {readerKpis.adCtrBySlot.map((row) => (
                          <tr key={row.slot_key} className="border-b border-border/60 last:border-0">
                            <td className="py-2 font-mono text-xs">{row.slot_key}</td>
                            <td className="py-2 tabular-nums">{row.impressions}</td>
                            <td className="py-2 tabular-nums">{row.clicks}</td>
                            <td className="py-2 tabular-nums">
                              {row.ctr != null
                                ? row.ctr.toLocaleString('fr-FR', {
                                    style: 'percent',
                                    maximumFractionDigits: 2,
                                  })
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <IconCategory className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Top catégories (vues cumulées)</span>
                </div>
                {readerKpis.topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Pas encore de données.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {readerKpis.topCategories.slice(0, 6).map((c) => (
                      <li
                        key={c.category_id ?? 'none'}
                        className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {c.total_views.toLocaleString('fr-FR')} vues · {c.article_count} art.
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Heading as="h3" level="h5">
                Articles les plus lus
              </Heading>
              <Link href="/admin/articles?status=published" className="text-sm font-medium text-primary hover:underline">
                Articles
              </Link>
            </div>
            {readerKpis.topArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun article publié.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Titre</th>
                      <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                        Catégorie
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Vues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readerKpis.topArticles.map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/articles/${a.id}/edit`}
                            className="font-medium hover:text-primary"
                          >
                            {a.title}
                          </Link>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          {a.category_slug ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {a.view_count.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {readerKpis.subscriberGrowth.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-medium">Inscriptions newsletter (par semaine)</div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {readerKpis.subscriberGrowth.map((g) => (
                    <span key={g.week_start} className="rounded-md border border-border px-2 py-1">
                      Sem. {g.week_start}:{' '}
                      <strong className="text-foreground">{g.new_subscribers}</strong>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
