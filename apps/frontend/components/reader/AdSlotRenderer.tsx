'use client'

import { useEffect, useRef, useState } from 'react'
import { AdSlotFrame } from 'scoop'
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

/**
 * Renders a reserved ad surface with `data-ad-slot`. Loads tracking only when visible.
 * Without a creative, shows fallback (house / placeholder) — no third-party script.
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
      { rootMargin: '120px', threshold: 0.01 }
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
    })
  }, [visible, creative, articleId])

  const defaultFallback = (
    <div className="flex min-h-[100px] flex-col items-center justify-center gap-1 text-center">
      <span className="text-xs text-[var(--on-glass-muted)]">Espace publicitaire</span>
      <span className="text-[length:var(--text-xs)] text-[var(--on-glass-muted)]/80">
        Emplacement {slotKey}
      </span>
    </div>
  )

  const inner = creative ? (
    <a
      href={creative.link_url}
      target="_blank"
      rel="noopener sponsored noreferrer"
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() =>
        postAdEvent('/ads/events/click', {
          creative_id: creative.id,
          article_id: articleId,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        })
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic remote ad URLs */}
      <img
        src={creative.image_url}
        alt={creative.alt ?? label}
        className="mx-auto max-h-[280px] w-auto max-w-full rounded-md object-contain transition-opacity group-hover:opacity-95"
        width={600}
        height={400}
      />
    </a>
  ) : (
    (fallback ?? defaultFallback)
  )

  return (
    <div ref={rootRef} data-ad-slot={slotKey} className={className}>
      <AdSlotFrame label={label}>{inner}</AdSlotFrame>
    </div>
  )
}
