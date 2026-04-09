import { apiGet } from '@/lib/api/client'
import type { Announcement, AnnouncementsResponse } from '@/lib/api/types'

export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const res = await apiGet<AnnouncementsResponse>('/announcements', { revalidate: 60 })
    return res.data ?? []
  } catch {
    return []
  }
}

/** Top bar: first banner placement, else first item. Ticker: remaining items (no duplicate of bar). */
export function splitAnnouncementsForChrome(announcements: Announcement[]) {
  const sorted = [...announcements].sort((a, b) => b.priority - a.priority)
  const bar =
    sorted.find((a) => a.placement === 'banner') ?? sorted[0] ?? null
  const rest = bar ? sorted.filter((a) => a.id !== bar.id) : sorted
  /** Inline placements belong in article bodies, not the header ticker. */
  const tickerSource = rest.filter((a) => a.placement !== 'inline')
  const urgentBar = bar ? bar.priority >= 10 : false
  return { bar, tickerSource, urgentBar }
}

export function announcementTickerItems(announcements: Announcement[]) {
  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    href: a.link_url,
  }))
}

export function inlineAnnouncements(announcements: Announcement[]) {
  return announcements.filter((a) => a.placement === 'inline')
}
