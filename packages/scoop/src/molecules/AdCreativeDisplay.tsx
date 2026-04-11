'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { toYoutubeEmbedUrl } from '../utils/youtubeEmbed'

export type AdCreativeFormat = 'image' | 'native' | 'video'

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
}

function resolveFormat(c: AdCreativeDisplayModel): AdCreativeFormat {
  if (c.format) return c.format
  if (c.video_url?.trim()) return 'video'
  if (c.image_url?.trim()) return 'image'
  return 'native'
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
}: AdCreativeDisplayProps) {
  const fmt = resolveFormat(creative)
  const altText = creative.alt?.trim() || creative.headline || frameLabel
  const ctaLabel = creative.cta_label?.trim() || defaultCtaLabel
  const rel = 'noopener sponsored noreferrer'

  if (fmt === 'video' && creative.video_url?.trim()) {
    const embed = toYoutubeEmbedUrl(creative.video_url.trim())
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {embed ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
            <iframe
              src={`${embed}?rel=0`}
              title={altText}
              className="h-full w-full border-0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
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
          <div className="shrink-0 overflow-hidden rounded-md sm:w-2/5">
            <img
              src={creative.image_url}
              alt={altText}
              className="h-full max-h-48 w-full object-cover transition-opacity group-hover:opacity-95 sm:max-h-none"
              width={400}
              height={240}
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
        className={cn('group block outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
        onClick={onLinkClick}
      >
        <img
          src={creative.image_url}
          alt={altText}
          className="mx-auto max-h-[280px] w-auto max-w-full rounded-md object-contain transition-opacity group-hover:opacity-95"
          width={600}
          height={400}
        />
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
