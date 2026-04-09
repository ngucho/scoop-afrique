import Link from 'next/link'
import { AnnouncementBar, Ticker } from 'scoop'
import type { Announcement } from '@/lib/api/types'

export interface ReaderChromeProps {
  bannerAnnouncements: Announcement[]
  tickerItems: { id: string; title: string; href?: string | null }[]
  /** When true, bar uses signal variant and ticker stays subdued (X1). */
  urgentBar?: boolean
}

/**
 * Global reader chrome: optional top announcement strip + breaking ticker.
 * Server-composed; ticker duplicates critical pattern per motion guidelines.
 */
export function ReaderChrome({ bannerAnnouncements, tickerItems, urgentBar }: ReaderChromeProps) {
  const top = bannerAnnouncements[0]
  const showBar = !!top
  const showTicker = tickerItems.length > 0

  const barVariant = urgentBar && showBar ? 'signal' : 'default'

  return (
    <>
      {showBar ? (
        <AnnouncementBar variant={barVariant} className="reader-announcement-bar">
          <span className="max-w-4xl">
            {top!.link_url ? (
              <Link href={top!.link_url} className="underline underline-offset-2 hover:opacity-90">
                {top!.title}
              </Link>
            ) : (
              top!.title
            )}
            {top!.body ? (
              <span className="mt-1 block text-xs font-normal text-[var(--on-glass-muted)] md:inline md:mt-0 md:before:content-['—_']">
                {top!.body}
              </span>
            ) : null}
          </span>
        </AnnouncementBar>
      ) : null}

      {showTicker ? (
        <div className="reader-breaking-ticker">
          <div className="border-b border-[var(--glass-border)] bg-muted/40 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-left">
            Fil info
          </div>
          <div className="reader-ticker-marquee">
            <Ticker speed={32} className={!urgentBar || !showBar ? 'border-t-0' : ''} aria-label="Fil info défilant">
              {tickerItems.map((item) => (
                <span key={item.id} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-foreground">
                  <span className="rounded-full bg-[var(--signal)]/15 px-2 py-0.5 text-xs text-[var(--signal)]">Info</span>
                  {item.href ? (
                    <Link href={item.href} className="hover:underline">
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </span>
              ))}
            </Ticker>
          </div>
          <ul
            className="reader-ticker-static-list mx-auto max-w-6xl list-none gap-2 px-4 py-3 md:columns-2"
            aria-label="Fil info"
          >
            {tickerItems.slice(0, 8).map((item) => (
              <li key={`static-${item.id}`} className="mb-2 break-inside-avoid text-sm">
                <span className="mr-2 inline-block rounded-full bg-[var(--signal)]/15 px-2 py-0.5 text-xs text-[var(--signal)]">
                  Info
                </span>
                {item.href ? (
                  <Link href={item.href} className="text-primary hover:underline">
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  )
}
