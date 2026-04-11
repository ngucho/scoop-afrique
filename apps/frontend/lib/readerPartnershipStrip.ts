import { apiGet } from '@/lib/api/client'
import type { HomepageSection } from '@/lib/api/types'

/** Piloté par le CMS (homepage_sections.key = partnership_strip). */
export async function isPartnershipStripEnabled(): Promise<boolean> {
  try {
    const res = await apiGet<{ data: HomepageSection[] }>('/homepage/sections', { revalidate: 30 })
    const row = res.data?.find((s) => s.key === 'partnership_strip')
    return row?.is_visible === true
  } catch {
    return false
  }
}
