import Link from 'next/link'
import { Badge, Button, SectionHeader } from 'scoop'
import type { Announcement } from '@/lib/api/types'
import type { ReaderContribution } from '@/lib/api/types'
import { contributionExcerpt } from '@/lib/tribuneSnapshot'

function kindLabel(kind: ReaderContribution['kind']) {
  return kind === 'event' ? 'Événement' : 'Tribune'
}

export function HomeLeftRail({
  contributions,
  sidebarAnnouncements,
}: {
  contributions: ReaderContribution[]
  sidebarAnnouncements: Announcement[]
}) {
  return (
    <aside className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-xl border border-border bg-card/80 shadow-sm backdrop-blur-sm">
        <div className="border-b border-border/80 px-4 pb-3 pt-4">
          <SectionHeader label="La Tribune" className="mb-1" />
          <p className="text-xs text-muted-foreground">
            Ce que la communauté publie en ce moment — rejoignez le débat ou ouvrez votre tribune.
          </p>
        </div>
        <div className="px-4 py-3">
          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Soyez le premier à partager une analyse ou un événement sur la Tribune.
            </p>
          ) : (
            <ul className="space-y-3">
              {contributions.map((c) => (
                <li key={c.id} className="min-w-0">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <Badge variant="muted" className="text-[10px] font-semibold uppercase tracking-wide">
                      {kindLabel(c.kind)}
                    </Badge>
                    {c.comment_count != null && c.comment_count > 0 ? (
                      <span className="text-[10px] text-muted-foreground">{c.comment_count} commentaire(s)</span>
                    ) : null}
                  </div>
                  <Link
                    href={`/tribune#tribune-contribution-${c.id}`}
                    className="block font-semibold leading-snug text-foreground hover:text-primary"
                    prefetch={false}
                  >
                    {c.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{contributionExcerpt(c.body)}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild size="sm" variant="default" className="w-full sm:w-auto">
              <Link href="/tribune" prefetch={false}>
                Ouvrir la Tribune
              </Link>
            </Button>
            <Link
              href="/tribune/profile"
              className="text-center text-xs font-semibold uppercase tracking-wider text-primary hover:underline sm:text-left"
              prefetch={false}
            >
              Ma tribune
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/20">
        <div className="border-b border-border/80 px-4 pb-3 pt-4">
          <SectionHeader label="Offres & annonces" className="mb-1" />
          <p className="text-xs text-muted-foreground">
            Emplois, événements éditoriaux et messages courts — gérés depuis le back-office (emplacement « Accueil —
            colonne gauche »).
          </p>
        </div>
        <div className="space-y-3 px-4 py-3">
          {sidebarAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune annonce dans cette colonne pour le moment.
            </p>
          ) : (
            sidebarAnnouncements.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-border/80 bg-card/60 px-3 py-3 last:pb-3"
              >
                <p className="text-sm font-semibold leading-snug">{a.title}</p>
                <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">{a.body}</p>
                {a.link_url ? (
                  <a
                    href={a.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                  >
                    En savoir plus →
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
