import { AdSlotRenderer } from '@/components/reader/AdSlotRenderer'
import type { AdCreative } from '@/lib/api/types'
import type { AdSlotKey } from '@/lib/readerAds'

interface AdSlotSectionProps {
  slotKey: AdSlotKey | string
  creative: AdCreative | null
  className?: string
  articleId?: string
  label?: string
  fallback?: React.ReactNode
}

/** Server wrapper around the client ad slot (lazy visibility + tracking). */
export function AdSlotSection({ slotKey, creative, className, articleId, label, fallback }: AdSlotSectionProps) {
  return (
    <AdSlotRenderer
      slotKey={String(slotKey)}
      creative={creative}
      className={className}
      articleId={articleId}
      label={label}
      fallback={fallback}
    />
  )
}
