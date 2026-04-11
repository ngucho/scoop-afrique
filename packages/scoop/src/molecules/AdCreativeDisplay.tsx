'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { toYoutubeEmbedUrl } from '../utils/youtubeEmbed'

export type AdCreativeFormat = 'image' | 'native' | 'video'

/** Contenant média fixe par emplacement (IAB-like) — évite qu’une image géante casse la grille. */
export type AdCreativeSlotLayout =
  | 'banner-leaderboard'
  | 'banner-billboard'
  | 'rectangle'
  | 'rail'
  | 'inline-wide'
  | 'native'

export interface AdCreativeDisplayModel {
  format?: AdCreativeFormat
  headline: string
  body?: string | null
  image_url?: string | null
  link_url: string
  cta_label?: string | null
  video_url?: string | null
  alt?: string | null
}

export interface AdCreativeDisplayProps {
  creative: AdCreativeDisplayModel
  /** Libellé du cadre pub (accessibilité image / iframe). */
  frameLabel?: string
  sponsoredLabel?: string
  defaultCtaLabel?: string
  unsupportedVideoMessage?: string
  onLinkClick?: () => void
  className?: string
  /** Contrainte de zone média selon la position (slot) côté reader. */
  slotLayout?: AdCreativeSlotLayout
}

function resolveFormat(c: AdCreativeDisplayModel): AdCreativeFormat {
  if (c.format) return c.format
  if (c.video_url?.trim()) return 'video'
  if (c.image_url?.trim()) return 'image'
  return 'native'
}

/**
 * Gabarits alignés sur les tailles IAB courantes (réf. LEAN / Display) :
 * - Mobile banner 320×50, Leaderboard 728×90
 * - Large mobile banner 320×100, Billboard 970×250
 * - Medium rectangle (MPU) 300×250, Half-page 300×600
 * - Super leaderboard 970×90 : en responsive 320×50 → 728×90 (sm) → 970×90 (lg)
 * - Ratio lien / social ~1,91:1 (1200×628)
 */
function mediaShellClasses(layout: AdCreativeSlotLayout | undefined): string {
  const L = layout ?? 'inline-wide'
  switch (L) {
    case 'banner-leaderboard':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-md bg-muted',
        'max-w-[320px] aspect-[320/50]',
        'sm:max-w-[728px] sm:aspect-[728/90]',
      )
    case 'banner-billboard':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-md bg-muted',
        'max-w-[320px] aspect-[320/100]',
        'md:max-w-[970px] md:aspect-[970/250]',
      )
    case 'rectangle':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-md bg-muted',
        'max-w-[300px] aspect-[300/250]',
      )
    case 'rail':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-md bg-muted',
        'max-w-[300px] aspect-[300/600] max-h-[600px]',
      )
    case 'native':
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-md bg-muted',
        'max-w-[600px] aspect-[1200/628] max-h-[min(314px,42vh)]',
      )
    case 'inline-wide':
    default:
      return cn(
        'relative mx-auto w-full overflow-hidden rounded-md bg-muted',
        'max-w-[320px] aspect-[320/50]',
        'sm:max-w-[728px] sm:aspect-[728/90]',
        'lg:max-w-[970px] lg:aspect-[970/90]',
      )
  }
}

function fillMediaClass(): string {
  return 'absolute inset-0 h-full w-full object-cover object-center'
}

/**
 * Rendu display / native / vidéo pour une créative IAB-like — uniquement présentation (pas de tracking).
 */
export function AdCreativeDisplay({
  creative,
  frameLabel = 'Publicité',
  sponsoredLabel = 'Sponsorisé',
  defaultCtaLabel = 'Découvrir',
  unsupportedVideoMessage = 'Vidéo (URL non prise en charge)',
  onLinkClick,
  className,
  slotLayout,
}: AdCreativeDisplayProps) {
  const fmt = resolveFormat(creative)
  const altText = creative.alt?.trim() || creative.headline || frameLabel
  const ctaLabel = creative.cta_label?.trim() || defaultCtaLabel
  const rel = 'noopener sponsored noreferrer'
  const shell = mediaShellClasses(slotLayout)

  if (fmt === 'video' && creative.video_url?.trim()) {
    const embed = toYoutubeEmbedUrl(creative.video_url.trim())
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {embed ? (
          <div className={shell}>
            <iframe
              src={`${embed}?rel=0`}
              title={altText}
              className={fillMediaClass()}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className={cn(shell, 'flex items-center justify-center text-sm text-muted-foreground')}>
            {unsupportedVideoMessage}
          </div>
        )}
        {creative.headline ? <p className="text-sm font-semibold text-foreground">{creative.headline}</p> : null}
        {creative.body ? <p className="text-sm text-muted-foreground">{creative.body}</p> : null}
        <a
          href={creative.link_url}
          target="_blank"
          rel={rel}
          className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onLinkClick}
        >
          {ctaLabel}
        </a>
      </div>
    )
  }

  if (fmt === 'native') {
    return (
      <a
        href={creative.link_url}
        target="_blank"
        rel={rel}
        className={cn(
          'group flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-4 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-stretch',
          className
        )}
        onClick={onLinkClick}
      >
        {creative.image_url ? (
          <div className="relative h-[140px] w-full shrink-0 overflow-hidden rounded-md sm:h-[160px] sm:w-2/5 sm:max-w-[260px]">
            <img
              src={creative.image_url}
              alt={altText}
              className="h-full w-full object-cover transition-opacity group-hover:opacity-95"
              width={400}
              height={250}
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {sponsoredLabel}
          </span>
          <span className="font-semibold text-foreground">{creative.headline}</span>
          {creative.body ? <span className="text-sm text-muted-foreground">{creative.body}</span> : null}
          <span className="mt-1 inline-flex w-fit rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            {ctaLabel}
          </span>
        </div>
      </a>
    )
  }

  if (creative.image_url?.trim()) {
    return (
      <a
        href={creative.link_url}
        target="_blank"
        rel={rel}
        className={cn('group block w-full max-w-full outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
        onClick={onLinkClick}
      >
        <div className={shell}>
          <img
            src={creative.image_url}
            alt={altText}
            className={cn(fillMediaClass(), 'transition-opacity group-hover:opacity-95')}
            width={728}
            height={90}
            loading="lazy"
            decoding="async"
          />
        </div>
      </a>
    )
  }

  return (
    <a
      href={creative.link_url}
      target="_blank"
      rel={rel}
      className={cn(
        'block rounded-lg border border-border bg-muted/30 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      onClick={onLinkClick}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{sponsoredLabel}</span>
      <p className="mt-1 font-semibold text-foreground">{creative.headline}</p>
      {creative.body ? <p className="mt-2 text-sm text-muted-foreground">{creative.body}</p> : null}
      <span className="mt-3 inline-block text-sm font-medium text-primary">{ctaLabel} →</span>
    </a>
  )
}
