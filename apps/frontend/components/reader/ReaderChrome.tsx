import Link from 'next/link'
import { Ticker } from 'scoop'

export interface ReaderChromeProps {
  /** Breaking / fil info ticker (announcement strip lives in ReaderHeader). */
  tickerItems: { id: string; title: string; href?: string | null }[]
}

/**
 * Fil info ticker below the main reader header.
 */
export function ReaderChrome({ tickerItems }: ReaderChromeProps) {
  const showTicker = tickerItems.length > 0

  return (
    <>
      {showTicker ? (
        <div className="reader-breaking-ticker">
          <div className="border-b border-[var(--glass-border)] bg-muted/40 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-left">
            Fil info
          </div>
          <div className="reader-ticker-marquee">
            <Ticker speed={32} className="border-t-0" aria-label="Fil info défilant">
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
