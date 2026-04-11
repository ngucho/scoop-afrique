import type { AdCreativeSlotLayout } from 'scoop'
import { AD_SLOT_KEYS, type AdSlotKey } from '@/lib/readerAds'

/** Mise en page média fixe par clé d’emplacement (unités IAB : Leaderboard, Billboard, MPU, Half-page, etc.). */
export function getAdSlotLayout(slotKey: string): AdCreativeSlotLayout {
  const k = slotKey as AdSlotKey
  switch (k) {
    case AD_SLOT_KEYS.GLOBAL_TOP_BANNER:
    case AD_SLOT_KEYS.LIST_TOP:
    case AD_SLOT_KEYS.CAT_TOP:
    case AD_SLOT_KEYS.ARTICLE_TOP:
      return 'banner-leaderboard'
    case AD_SLOT_KEYS.HOME_BOTTOM:
    case AD_SLOT_KEYS.ARTICLE_BOTTOM:
      return 'banner-billboard'
    case AD_SLOT_KEYS.HOME_MID_1:
    case AD_SLOT_KEYS.LIST_MID:
    case AD_SLOT_KEYS.ARTICLE_MID:
    case AD_SLOT_KEYS.RELATED_BELOW:
      return 'rectangle'
    case AD_SLOT_KEYS.ARTICLE_RAIL:
      return 'rail'
    case AD_SLOT_KEYS.HOME_HERO_SPONSOR:
      return 'native'
    case AD_SLOT_KEYS.HOME_SPONSOR_LOGOS:
      return 'inline-wide'
    default:
      return 'inline-wide'
  }
}

export function adSlotFrameDensity(slotLayout: AdCreativeSlotLayout): 'default' | 'compact' {
  if (slotLayout === 'rail' || slotLayout === 'native') return 'default'
  if (
    slotLayout === 'banner-leaderboard' ||
    slotLayout === 'banner-billboard' ||
    slotLayout === 'rectangle' ||
    slotLayout === 'inline-wide'
  ) {
    return 'compact'
  }
  return 'default'
}
