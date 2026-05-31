import Link from 'next/link'
import { Button, SectionHeader } from 'scoop'
import type { Announcement } from '@/lib/api/types'
import type { ReaderContribution } from '@/lib/api/types'
import { contributionExcerpt } from '@/lib/tribuneSnapshot'

function KindBadge({ kind }: { kind: ReaderContribution['kind'] }) {
  const isEvent = kind === 'event'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.18em] ${
        isEvent
          ? 'bg-[var(--editorial-tertiary-container)]/20 text-[var(--editorial-tertiary)]'
          : 'bg-primary/8 text-primary'
      }`}
    >
      {isEvent ? 'Événement' : 'Tribune'}
    </span>
  )
}

export function HomeLeftRail({
  contributions,
  sidebarAnnouncements,
}: {
  contributions: ReaderContribution[]
  sidebarAnnouncements: Announcement[]
}) {
  return (
    <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">

      {/* Tribune section */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-sm)]">
        <div className="border-b border-border px-4 pb-3 pt-4">
          <SectionHeader label="La Tribune" variant="editorial" className="mb-2" />
          <p className="font-sans text-xs leading-relaxed text-muted-foreground">
            La communauté s&apos;exprime — rejoignez le débat.
          </p>
        </div>

        <div className="px-4 py-3">
          {contributions.length === 0 ? (
            <p className="font-sans text-sm text-muted-foreground">
              Soyez le premier à ouvrir une tribune ou signaler un événement.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {contributions.map((c) => (
                <li key={c.id} className="group min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <KindBadge kind={c.kind} />
                    {c.comment_count != null && c.comment_count > 0 ? (
                      <span className="font-sans text-[9px] text-muted-foreground">
                        {c.comment_count} commentaire{c.comment_count > 1 ? 's' : ''}
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href={`/tribune#tribune-contribution-${c.id}`}
                    className="block font-sans text-sm font-semibold leading-snug text-foreground transition-colors duration-150 group-hover:text-primary"
                    prefetch={false}
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    {c.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 font-sans text-xs leading-relaxed text-muted-foreground">
                    {contributionExcerpt(c.body)}
                  </p>
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
              className="text-center font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-primary transition-opacity hover:opacity-80 sm:text-left"
              prefetch={false}
            >
              Ma tribune
            </Link>
          </div>
        </div>
      </div>

      {/* Offres & annonces */}
      {sidebarAnnouncements.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          <div className="border-b border-border px-4 pb-3 pt-4">
            <SectionHeader label="Offres & Annonces" variant="editorial" className="mb-2" />
          </div>
          <div className="space-y-3 px-4 py-3">
            {sidebarAnnouncements.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-border/60 bg-card/70 px-3 py-3"
              >
                <p className="font-sans text-sm font-semibold leading-snug text-foreground">
                  {a.title}
                </p>
                {a.body ? (
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>
                ) : null}
                {a.link_url ? (
                  <a
                    href={a.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-primary transition-opacity hover:opacity-80"
                  >
                    En savoir plus <span aria-hidden>→</span>
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
