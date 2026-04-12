'use client'

import { useEffect, useState } from 'react'
import type { AdCreativeSlotLayout } from 'scoop'
import { cn, usePrefersReducedMotion } from 'scoop'
import {
  IconBrandTiktok,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandThreads,
  type TablerIcon,
} from '@tabler/icons-react'
import { SCOOP_SOCIAL_CTA_POOL, slotKeyHash, type ScoopSocialCta } from '@/lib/scoopSocialCtas'
import { useReaderAdFallbackCopy } from '@/components/reader/ReaderAdFallbackContext'

function mediaShellClasses(layout: AdCreativeSlotLayout): string {
  switch (layout) {
    case 'banner-leaderboard':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-xl',
        'max-w-[320px] aspect-[320/50]',
        'sm:max-w-[728px] sm:aspect-[728/90]',
      )
    case 'banner-billboard':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-xl',
        'max-w-[320px] aspect-[320/100]',
        'md:max-w-[970px] md:aspect-[970/250]',
      )
    case 'rectangle':
      return cn('relative mx-auto w-full overflow-hidden rounded-xl', 'max-w-[300px] aspect-[300/250]')
    case 'rail':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-xl',
        'max-w-[300px] aspect-[300/600] max-h-[600px]',
      )
    case 'native':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-xl',
        'max-w-[600px] aspect-[1200/628] max-h-[min(314px,42vh)]',
      )
    case 'inline-wide':
    default:
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-xl',
        'max-w-[320px] aspect-[320/50]',
        'sm:max-w-[728px] sm:aspect-[728/90]',
        'lg:max-w-[970px] lg:aspect-[970/90]',
      )
  }
}

const ICON_BY_ID: Record<ScoopSocialCta['id'], TablerIcon> = {
  tiktok: IconBrandTiktok,
  facebook: IconBrandFacebook,
  instagram: IconBrandInstagram,
  youtube: IconBrandYoutube,
  threads: IconBrandThreads,
}

export function ScoopSocialAdFallback({
  slotKey,
  slotLayout,
}: {
  slotKey: string
  slotLayout: AdCreativeSlotLayout
}) {
  const reduceMotion = usePrefersReducedMotion()
  const cms = useReaderAdFallbackCopy()
  const [cta, setCta] = useState<ScoopSocialCta | null>(null)

  useEffect(() => {
    const h = slotKeyHash(slotKey)
    const n = SCOOP_SOCIAL_CTA_POOL.length
    const idx = (h * 17 + Math.floor(Math.random() * n)) % n
    setCta(SCOOP_SOCIAL_CTA_POOL[idx])
  }, [slotKey])

  if (!cta) {
    return (
      <div
        className={cn(mediaShellClasses(slotLayout), 'bg-muted/40')}
        aria-hidden
      />
    )
  }

  const Icon = ICON_BY_ID[cta.id]
  const headline = cms.title?.trim() || 'Scoop.Afrique'
  const subline =
    cms.subtitle?.trim() ||
    "Suivez-nous sur les réseaux — ne manquez rien de l'actualité."

  return (
    <div className={cn(mediaShellClasses(slotLayout), 'isolate')}>
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          cta.accent,
          !reduceMotion && 'scoop-ad-fallback-gradient',
        )}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" aria-hidden />

      <div className="relative flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 px-3 py-2 text-center sm:gap-2 sm:px-6 sm:py-4">
        <img
          src="/brand-logo.svg"
          alt=""
          className={cn(
            'h-5 w-auto opacity-95 drop-shadow-sm sm:h-7',
            !reduceMotion && 'scoop-ad-fallback-logo',
          )}
        />

        <p
          className={cn(
            'max-w-[95%] font-sans text-[10px] font-extrabold uppercase leading-tight tracking-[0.2em] text-foreground/95 sm:text-xs md:text-sm',
            !reduceMotion && 'scoop-ad-fallback-title',
          )}
        >
          {headline}
        </p>

        <p
          className={cn(
            'max-w-[98%] px-1 text-[9px] font-medium leading-snug text-foreground/85 sm:text-[11px] md:text-xs',
            !reduceMotion && 'scoop-ad-fallback-sub',
          )}
        >
          {subline}
        </p>

        <a
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'mt-1 inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border-2 border-primary/80 bg-background/80 px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm transition hover:bg-primary hover:text-primary-foreground sm:mt-2 sm:gap-2 sm:px-4 sm:py-1.5 sm:text-[10px] md:text-xs',
            !reduceMotion && 'scoop-ad-fallback-cta',
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
          <span className="truncate">{cta.cta}</span>
        </a>
      </div>
    </div>
  )
}
