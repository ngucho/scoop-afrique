'use client'

import { useEffect, useRef, useState } from 'react'
import { AdSlotFrame, AdCreativeDisplay, AdSlotEmptyState, type AdCreativeDisplayModel } from 'scoop'
import { config } from '@/lib/config'
import type { AdCreative } from '@/lib/api/types'

const API_PREFIX = '/api/v1'

export interface AdSlotRendererProps {
  slotKey: string
  creative: AdCreative | null
  label?: string
  className?: string
  /** Shown when no creative or before intersection (placeholder mode). */
  fallback?: React.ReactNode
  articleId?: string
}

function postAdEvent(path: '/ads/events/impression' | '/ads/events/click', body: Record<string, unknown>) {
  const base = config.apiBaseUrl.replace(/\/$/, '')
  const url = `${base}${API_PREFIX}${path}`
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {})
}

function resolveFormat(creative: AdCreative): AdCreativeDisplayModel['format'] {
  if (creative.format) return creative.format
  if (creative.video_url?.trim()) return 'video'
  if (creative.image_url?.trim()) return 'image'
  return 'native'
}

function toDisplayModel(creative: AdCreative): AdCreativeDisplayModel {
  return {
    format: creative.format,
    headline: creative.headline,
    body: creative.body,
    image_url: creative.image_url,
    link_url: creative.link_url,
    cta_label: creative.cta_label,
    video_url: creative.video_url,
    alt: creative.alt,
  }
}

/**
 * Réserve un emplacement `data-ad-slot`, envoie les événements quand visible, délègue le rendu au design system.
 */
export function AdSlotRenderer({
  slotKey,
  creative,
  label = 'Publicité',
  className,
  fallback,
  articleId,
}: AdSlotRendererProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const impressionSent = useRef(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el || !creative) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true)
      },
      { rootMargin: '120px', threshold: 0.01 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [creative])

  useEffect(() => {
    if (!visible || !creative || impressionSent.current) return
    impressionSent.current = true
    postAdEvent('/ads/events/impression', {
      creative_id: creative.id,
      article_id: articleId,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      metadata: { format: resolveFormat(creative) },
    })
  }, [visible, creative, articleId])

  const trackClick = () =>
    postAdEvent('/ads/events/click', {
      creative_id: creative!.id,
      article_id: articleId,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      metadata: { format: creative ? resolveFormat(creative) : undefined },
    })

  const defaultFallback = <AdSlotEmptyState slotKey={slotKey} />

  const content = creative ? (
    <AdCreativeDisplay creative={toDisplayModel(creative)} frameLabel={label} onLinkClick={trackClick} />
  ) : (
    (fallback ?? defaultFallback)
  )

  return (
    <div ref={rootRef} data-ad-slot={slotKey} className={className}>
      <AdSlotFrame label={label}>{content}</AdSlotFrame>
    </div>
  )
}
