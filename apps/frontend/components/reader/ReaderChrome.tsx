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
          <div className="reader-ticker-marquee border-b border-border bg-muted/40">
            <div className="flex min-h-11 items-center">
              <div className="flex h-11 shrink-0 items-center border-r border-border bg-primary px-4 font-sans text-xs font-black uppercase tracking-[0.14em] text-primary-foreground">
                Fil info
              </div>
              <div className="min-w-0 flex-1">
                <Ticker speed={32} className="border-t-0 border-b-0 bg-transparent" aria-label="Fil info defilant">
                  {tickerItems.map((item) => (
                    <span key={item.id} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-foreground">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Info</span>
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
            </div>
          </div>
          <ul
            className="reader-ticker-static-list mx-auto max-w-6xl list-none gap-2 border-b border-border px-4 py-3 md:columns-2"
            aria-label="Fil info"
          >
            {tickerItems.slice(0, 8).map((item) => (
              <li key={`static-${item.id}`} className="mb-2 break-inside-avoid text-sm">
                <span className="mr-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
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
