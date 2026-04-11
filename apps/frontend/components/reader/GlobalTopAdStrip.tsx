import { AdSlotSection } from '@/components/reader/AdSlotSection'
import { fetchAdPlacements, pickCreativeForSlot, AD_SLOT_KEYS } from '@/lib/readerAds'

/**
 * Bandeau global pleine largeur sous le header — même emplacement que la campagne
 * « GLOBAL_TOP_BANNER » (pas de doublon dans le contenu de la page).
 */
export async function GlobalTopAdStrip() {
  const { slots, creatives_by_slot } = await fetchAdPlacements()
  const picked = pickCreativeForSlot(slots, creatives_by_slot, AD_SLOT_KEYS.GLOBAL_TOP_BANNER)
  if (!picked) return null

  return (
    <div className="border-b border-border/80 bg-muted/15">
      <div className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <AdSlotSection
          slotKey={AD_SLOT_KEYS.GLOBAL_TOP_BANNER}
          creative={picked.creative}
          className="mx-auto w-full max-w-[min(100%,728px)]"
          label="Publicité"
        />
      </div>
    </div>
  )
}
