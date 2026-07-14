import Link from 'next/link'
import {
  IconAd,
  IconAlertCircle,
  IconArrowRight,
  IconChartBar,
  IconClock,
  IconEye,
  IconFileText,
  IconMessages,
  IconPlus,
  IconUsers,
} from '@tabler/icons-react'
import { formatDateShort } from '@/lib/formatDate'
import { getAdminSession } from '@/lib/admin/session'
import { fetchDashboardStats, fetchAdminArticles, fetchReaderKpis } from '@/lib/admin/fetchers'
import { STATUS_LABELS, hasMinRole, canViewReaderInsights, type AppRole } from '@/lib/admin/rbac'

function numberFr(value: number) {
  return value.toLocaleString('fr-FR')
}

function percentFr(value: number | null | undefined) {
  if (value == null) return 'N/A'
  return value.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 })
}

function SignalCard({
  label,
  value,
  href,
  tone = 'light',
  children,
}: {
  label: string
  value: string | number
  href?: string
  tone?: 'dark' | 'red' | 'lime' | 'light'
  children?: React.ReactNode
}) {
  const toneClass = {
    dark: 'border border-border bg-card text-foreground',
    red: 'border border-primary/20 bg-primary/8 text-foreground',
    lime: 'border border-border bg-secondary/45 text-foreground',
    light: 'border border-border bg-card text-foreground',
  }[tone]

  const body = (
    <div className={`min-h-[132px] rounded-[1.5rem] p-5 shadow-[var(--shadow-sm)] ${toneClass}`}>
      <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-4 text-4xl font-black leading-none">{value}</p>
      {children ? <div className="mt-4 text-sm leading-5 text-muted-foreground">{children}</div> : null}
    </div>
  )

  return href ? <Link href={href}>{body}</Link> : body
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 font-sans text-xs font-black uppercase tracking-[0.1em] text-primary-foreground hover:bg-primary/90"
    >
      {children}
      <IconArrowRight className="h-4 w-4" />
    </Link>
  )
}

export default async function AdminDashboardPage() {
  const [adminSession, stats, recentArticles, readerKpis] = await Promise.all([
    getAdminSession(),
    fetchDashboardStats(),
    fetchAdminArticles({ limit: 6 }),
    fetchReaderKpis(),
  ])

  const role: AppRole = adminSession?.role ?? 'journalist'
  const showReaderKpis = canViewReaderInsights(role) && readerKpis
  const greetingName =
    adminSession?.metadata?.name?.split(' ')[0] ??
    adminSession?.name?.split(' ')[0] ??
    adminSession?.email?.split('@')[0] ??
    'Utilisateur'
  const avgCtr = readerKpis?.adCtrBySlot.filter((row) => row.ctr != null)
  const avgCtrValue = avgCtr && avgCtr.length > 0
    ? avgCtr.reduce((sum, row) => sum + (row.ctr ?? 0), 0) / avgCtr.length
    : null

  return (
    <main className="space-y-8 bg-background text-foreground">
      <section className="rounded-[2rem] border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Cockpit
            </p>
            <h1
              className="mt-3 text-5xl font-black leading-[0.9] sm:text-7xl"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Bonjour, {greetingName}.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pipeline editorial, reader, ads et audience: les signaux utiles pour decider vite.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionLink href="/admin/articles/new">
              <IconPlus className="h-4 w-4" />
              Nouvel article
            </ActionLink>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-full border border-border bg-background px-4 font-sans text-xs font-black uppercase tracking-[0.1em] text-foreground hover:border-primary hover:text-primary"
            >
              Voir le site
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard label="Publies" value={numberFr(stats.published)} href="/admin/articles?status=published" tone="light">
          Articles disponibles cote reader.
        </SignalCard>
        <SignalCard label="Brouillons" value={numberFr(stats.drafts)} href="/admin/articles?status=draft" tone="light">
          Contenus a relancer ou nettoyer.
        </SignalCard>
        <SignalCard label="Revision" value={numberFr(stats.inReview)} href="/admin/articles?status=review" tone={stats.inReview > 0 ? 'red' : 'lime'}>
          {stats.inReview > 0 ? 'A traiter avant publication.' : 'File de revision calme.'}
        </SignalCard>
        <SignalCard
          label={hasMinRole(role, 'editor') ? 'Commentaires' : 'Total articles'}
          value={hasMinRole(role, 'editor') ? numberFr(stats.pendingComments) : numberFr(stats.totalArticles)}
          href={hasMinRole(role, 'editor') ? '/admin/comments?status=pending' : '/admin/articles'}
          tone="light"
        >
          {hasMinRole(role, 'editor') ? 'Commentaires en attente.' : 'Volume editorial global.'}
        </SignalCard>
      </section>

      {hasMinRole(role, 'editor') && stats.inReview > 0 ? (
        <section className="flex flex-col gap-4 rounded-[1.5rem] border border-primary/20 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <IconAlertCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-sans text-sm font-black uppercase tracking-[0.12em]">Action urgente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.inReview} article{stats.inReview > 1 ? 's' : ''} attend{stats.inReview > 1 ? 'ent' : ''} une validation.
              </p>
            </div>
          </div>
          <ActionLink href="/admin/articles?status=review">Voir la file</ActionLink>
        </section>
      ) : null}

      {showReaderKpis && readerKpis ? (
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.5rem] bg-card p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-primary">Reader</p>
                <h2 className="mt-1 text-2xl font-black">Audience & monetisation</h2>
              </div>
              <IconChartBar className="h-7 w-7 text-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SignalCard label="Abonnes" value={numberFr(readerKpis.newsletterTotals.confirmed)} href="/admin/reader/subscribers?status=confirmed" tone="light" />
              <SignalCard label="Pending" value={numberFr(readerKpis.newsletterTotals.pending)} href="/admin/reader/subscribers?status=pending" tone="light" />
              <SignalCard label="CTR ads" value={percentFr(avgCtrValue)} href="/admin/reader/ads" tone="lime" />
              <SignalCard label="Desinscrits" value={numberFr(readerKpis.newsletterTotals.unsubscribed)} href="/admin/reader/subscribers?status=unsubscribed" tone="light" />
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-sm font-black uppercase tracking-[0.14em]">Top contenus</h2>
              <Link href="/admin/articles?status=published" className="font-sans text-xs font-black uppercase tracking-[0.1em] text-primary">
                Articles
              </Link>
            </div>
            <div className="divide-y divide-border">
              {readerKpis.topArticles.slice(0, 6).map((article, index) => (
                <Link key={article.id} href={`/admin/articles/${article.id}/edit`} className="grid grid-cols-[2rem_1fr_auto] gap-3 py-3">
                  <span className="text-xl font-black text-muted-foreground/45">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-medium">{article.title}</span>
                    <span className="text-xs text-muted-foreground">{article.category_slug ?? 'sans rubrique'}</span>
                  </span>
                  <span className="font-sans text-sm font-black">{numberFr(article.view_count)}</span>
                </Link>
              ))}
              {readerKpis.topArticles.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Pas encore de donnees.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-sm font-black uppercase tracking-[0.14em]">Articles recents</h2>
            <Link href="/admin/articles" className="font-sans text-xs font-black uppercase tracking-[0.1em] text-primary">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentArticles.data.map((article) => (
              <Link key={article.id} href={`/admin/articles/${article.id}/edit`} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <span className="min-w-0">
                  <span className="line-clamp-1 font-medium">{article.title}</span>
                  <span className="text-xs text-muted-foreground">{article.category?.name ?? 'sans rubrique'}</span>
                </span>
                <span className="w-fit rounded-full bg-muted px-3 py-1 font-sans text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                  {STATUS_LABELS[article.status] ?? article.status}
                </span>
                <span className="text-xs text-muted-foreground">{formatDateShort(article.published_at ?? article.updated_at)}</span>
              </Link>
            ))}
            {recentArticles.data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <IconFileText className="h-10 w-10 text-muted-foreground/45" />
                <p className="text-sm text-muted-foreground">Aucun article pour le moment.</p>
                <ActionLink href="/admin/articles/new">Creer un article</ActionLink>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
          <h2 className="font-sans text-sm font-black uppercase tracking-[0.14em] text-primary">Acces rapides</h2>
          <div className="mt-5 grid gap-3">
            <Link href="/admin/articles" className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:border-primary hover:text-primary">
              <span className="flex items-center gap-3"><IconFileText className="h-5 w-5" /> Articles</span>
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/comments" className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:border-primary hover:text-primary">
              <span className="flex items-center gap-3"><IconMessages className="h-5 w-5" /> Commentaires</span>
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/reader/subscribers" className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:border-primary hover:text-primary">
              <span className="flex items-center gap-3"><IconUsers className="h-5 w-5" /> Abonnes</span>
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/reader/ads" className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:border-primary hover:text-primary">
              <span className="flex items-center gap-3"><IconAd className="h-5 w-5" /> Ads</span>
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard label="Programmes" value={numberFr(stats.scheduled)} href="/admin/articles?status=scheduled" tone="light">
          <IconClock className="mr-2 inline h-4 w-4" /> Articles planifies.
        </SignalCard>
        <SignalCard label="Commentaires total" value={numberFr(stats.totalComments)} href="/admin/comments" tone="light">
          <IconMessages className="mr-2 inline h-4 w-4" /> Activite communautaire.
        </SignalCard>
        <SignalCard label="Total articles" value={numberFr(stats.totalArticles)} href="/admin/articles" tone="light">
          <IconEye className="mr-2 inline h-4 w-4" /> Base editoriale.
        </SignalCard>
        <SignalCard label="Role" value={role} href="/admin/profile" tone="light">
          Permissions et profil courant.
        </SignalCard>
      </section>
    </main>
  )
}
