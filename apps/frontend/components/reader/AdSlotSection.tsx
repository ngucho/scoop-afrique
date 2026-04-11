import { AdSlotRenderer } from '@/components/reader/AdSlotRenderer'
import type { AdCreative } from '@/lib/api/types'
import type { AdSlotKey } from '@/lib/readerAds'
import type { AdCreativeSlotLayout } from 'scoop'

interface AdSlotSectionProps {
  slotKey: AdSlotKey | string
  creative: AdCreative | null
  className?: string
  articleId?: string
  label?: string
  fallback?: React.ReactNode
  slotLayout?: AdCreativeSlotLayout
}

/** Server wrapper around the client ad slot (lazy visibility + tracking). */
export function AdSlotSection({
  slotKey,
  creative,
  className,
  articleId,
  label,
  fallback,
  slotLayout,
}: AdSlotSectionProps) {
  return (
    <AdSlotRenderer
      slotKey={String(slotKey)}
      creative={creative}
      className={className}
      articleId={articleId}
      label={label}
      fallback={fallback}
      slotLayout={slotLayout}
    />
  )
}
