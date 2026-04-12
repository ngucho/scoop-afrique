import { PartnershipStrip } from './PartnershipStrip'
import { ReaderFooter } from './ReaderFooter'
import { GlobalTopAdStrip } from './GlobalTopAdStrip'
import { isPartnershipStripEnabled } from '@/lib/readerPartnershipStrip'
import { ReaderChrome } from './ReaderChrome'
import { ReaderHeader } from './ReaderHeader'
import { ReaderMobileDock } from './ReaderMobileDock'
import { apiGet } from '@/lib/api/client'
import type { Category } from '@/lib/api/types'
import { fetchAnnouncements, announcementTickerItems, splitAnnouncementsForChrome } from '@/lib/readerAnnouncements'
import { fetchReaderChromeFallback } from '@/lib/readerChrome'
import { ReaderAdFallbackProvider } from '@/components/reader/ReaderAdFallbackContext'
import { cn } from 'scoop'

async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiGet<{ data: Category[] }>('/categories', { revalidate: 600 })
    return res.data ?? []
  } catch {
    return []
  }
}

export async function ReaderLayout({
  children,
  /** Réseau Tribune : pas de bandeau pub « global top » (emplacements dédiés dans la zone). */
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'tribune'
}) {
  const [categories, announcements, partnershipStrip, emptyAdCopy] = await Promise.all([
    getCategories(),
    fetchAnnouncements(),
    isPartnershipStripEnabled(),
    fetchReaderChromeFallback(),
  ])
  const { bar, tickerSource, urgentBar } = splitAnnouncementsForChrome(announcements)
  const tickerItems = announcementTickerItems(tickerSource)

  return (
    <ReaderAdFallbackProvider value={emptyAdCopy}>
    <div className="flex min-h-screen flex-col bg-editorial-surface text-editorial-on-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Aller au contenu principal
      </a>
      <ReaderHeader bannerAnnouncement={bar} urgentBar={urgentBar} categories={categories} />
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          'flex flex-1 flex-col pb-24 outline-none md:pb-12',
          variant === 'tribune' && 'bg-gradient-to-b from-background via-muted/20 to-background',
        )}
      >
        {variant === 'default' ? <GlobalTopAdStrip /> : null}
        {tickerItems.length > 0 ? <ReaderChrome tickerItems={tickerItems} /> : null}
        {children}
      </main>
      <PartnershipStrip cmsEnabled={partnershipStrip} />
      <ReaderFooter />
      <ReaderMobileDock />
    </div>
    </ReaderAdFallbackProvider>
  )
}
