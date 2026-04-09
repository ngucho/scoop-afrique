import { ReaderSidebar } from './ReaderSidebar'
import { ReaderFooter } from './ReaderFooter'
import { ReaderChrome } from './ReaderChrome'
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
  const [categories, announcements] = await Promise.all([getCategories(), fetchAnnouncements()])
  const { bar, tickerSource, urgentBar } = splitAnnouncementsForChrome(announcements)
  const tickerItems = announcementTickerItems(tickerSource)

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Aller au contenu principal
      </a>
      <ReaderSidebar categories={categories} />
      <div className="flex min-h-screen flex-col pt-14 md:pt-0 md:pl-64 lg:pl-72">
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {bar || tickerItems.length > 0 ? (
            <ReaderChrome
              bannerAnnouncements={bar ? [bar] : []}
              tickerItems={tickerItems}
              urgentBar={urgentBar}
            />
          ) : null}
          {children}
        </main>
        <ReaderFooter />
      </div>
    </div>
  )
}
