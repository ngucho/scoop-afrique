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

async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiGet<{ data: Category[] }>('/categories', { revalidate: 600 })
    return res.data ?? []
  } catch {
    return []
  }
}

export async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const [categories, announcements, partnershipStrip] = await Promise.all([
    getCategories(),
    fetchAnnouncements(),
    isPartnershipStripEnabled(),
  ])
  const { bar, tickerSource, urgentBar } = splitAnnouncementsForChrome(announcements)
  const tickerItems = announcementTickerItems(tickerSource)

  return (
    <div className="flex min-h-screen flex-col bg-editorial-surface text-editorial-on-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Aller au contenu principal
      </a>
      <ReaderHeader bannerAnnouncement={bar} urgentBar={urgentBar} categories={categories} />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col pb-24 outline-none md:pb-12">
        <GlobalTopAdStrip />
        {tickerItems.length > 0 ? <ReaderChrome tickerItems={tickerItems} /> : null}
        {children}
      </main>
      <PartnershipStrip cmsEnabled={partnershipStrip} />
      <ReaderFooter />
      <ReaderMobileDock />
    </div>
  )
}
