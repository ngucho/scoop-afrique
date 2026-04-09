import { apiGet } from '@/lib/api/client'
import type { AdCreative, AdPlacementsResponse, AdSlot } from '@/lib/api/types'

export const AD_SLOT_KEYS = {
  GLOBAL_TOP_BANNER: 'GLOBAL_TOP_BANNER',
  HOME_HERO_SPONSOR: 'HOME_HERO_SPONSOR',
  HOME_MID_1: 'HOME_MID_1',
  HOME_BOTTOM: 'HOME_BOTTOM',
  HOME_SPONSOR_LOGOS: 'HOME_SPONSOR_LOGOS',
  LIST_TOP: 'LIST_TOP',
  LIST_MID: 'LIST_MID',
  CAT_TOP: 'CAT_TOP',
  ARTICLE_TOP: 'ARTICLE_TOP',
  ARTICLE_MID: 'ARTICLE_MID',
  ARTICLE_RAIL: 'ARTICLE_RAIL',
  ARTICLE_BOTTOM: 'ARTICLE_BOTTOM',
  RELATED_BELOW: 'RELATED_BELOW',
} as const

export type AdSlotKey = (typeof AD_SLOT_KEYS)[keyof typeof AD_SLOT_KEYS]

export async function fetchAdPlacements(): Promise<AdPlacementsResponse['data']> {
  try {
    const res = await apiGet<AdPlacementsResponse>('/ads/placements', { revalidate: 30 })
    return res.data ?? { slots: [], creatives_by_slot: {} }
  } catch {
    return { slots: [], creatives_by_slot: {} }
  }
}

export function pickCreativeForSlot(
  slots: AdSlot[],
  creativesBySlot: Record<string, AdCreative[]>,
  slotKey: string
): { slot: AdSlot; creative: AdCreative } | null {
  const slot = slots.find((s) => s.key === slotKey)
  if (!slot) return null
  const list = creativesBySlot[slot.id] ?? []
  if (list.length === 0) return null
  let pick = list[0]!
  let max = pick.weight ?? 1
  for (const c of list.slice(1)) {
    const w = c.weight ?? 1
    if (w > max) {
      max = w
      pick = c
    }
  }
  return { slot, creative: pick }
}
