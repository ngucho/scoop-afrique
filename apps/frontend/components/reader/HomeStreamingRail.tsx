'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { READER_STATE_EVENT, readReaderHistory, type ReaderHistoryItem } from '@/lib/readerHistory'

interface HomeStreamingRailProps {
  children: ReactNode
  className?: string
  speedPxPerSecond?: number
}

export function HomeStreamingRail({
  children,
  className,
  speedPxPerSecond = 24,
}: HomeStreamingRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const pauseUntilRef = useRef(0)
  const userPauseUntilRef = useRef(0)
  const pausedAdRef = useRef<string | null>(null)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    let frame = 0
    let last = performance.now()
    const applyPersonalizedOrder = () => {
      personalizeRailItems(rail, readReaderHistory())
      rail.scrollLeft = 0
    }

    applyPersonalizedOrder()
    window.addEventListener(READER_STATE_EVENT, applyPersonalizedOrder)
    const pauseForInteraction = () => {
      userPauseUntilRef.current = performance.now() + 5000
    }
    rail.addEventListener('pointerdown', pauseForInteraction, { passive: true })
    rail.addEventListener('touchstart', pauseForInteraction, { passive: true })
    rail.addEventListener('wheel', pauseForInteraction, { passive: true })

    const tick = (now: number) => {
      const elapsed = Math.min(80, now - last)
      last = now

      const ad = findCenteredAd(rail)
      if (ad) {
        const key = ad.getAttribute('data-home-rail-id') ?? ''
        if (pausedAdRef.current !== key) {
          pausedAdRef.current = key
          pauseUntilRef.current = now + 5000
        }
      } else if (now > pauseUntilRef.current) {
        pausedAdRef.current = null
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (
        !reducedMotion
        && now >= pauseUntilRef.current
        && now >= userPauseUntilRef.current
        && !rail.matches(':hover')
        && !rail.matches(':focus-within')
      ) {
        rail.scrollLeft += (speedPxPerSecond * elapsed) / 1000
        const maxScroll = rail.scrollWidth - rail.clientWidth
        if (maxScroll > 0 && rail.scrollLeft >= maxScroll - 2) {
          rail.scrollLeft = 0
          pausedAdRef.current = null
          pauseUntilRef.current = 0
        }
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener(READER_STATE_EVENT, applyPersonalizedOrder)
      rail.removeEventListener('pointerdown', pauseForInteraction)
      rail.removeEventListener('touchstart', pauseForInteraction)
      rail.removeEventListener('wheel', pauseForInteraction)
    }
  }, [speedPxPerSecond])

  return (
    <div
      ref={railRef}
      className={className}
      aria-live="off"
    >
      {children}
    </div>
  )
}

function personalizeRailItems(rail: HTMLDivElement, history: ReaderHistoryItem[]) {
  const items = Array.from(rail.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
  if (items.length < 3) return

  const primaryItems = items.filter((item) => item.dataset.homeCycle !== '1')
  const repeatedItems = items.filter((item) => item.dataset.homeCycle === '1')
  const scored = primaryItems.map((item, index) => ({
    item,
    index,
    score: railItemScore(item, history, index),
  }))

  scored.sort((a, b) => b.score - a.score || a.index - b.index)
  const orderByArticleId = new Map<string, number>()
  scored.forEach(({ item }, order) => {
    item.style.order = String(order)
    const articleId = item.dataset.homeArticleId
    if (articleId) orderByArticleId.set(articleId, order)
  })

  repeatedItems
    .sort((a, b) => {
      const aOrder = orderByArticleId.get(a.dataset.homeArticleId ?? '') ?? Number.MAX_SAFE_INTEGER
      const bOrder = orderByArticleId.get(b.dataset.homeArticleId ?? '') ?? Number.MAX_SAFE_INTEGER
      return aOrder - bOrder
    })
    .forEach((item, order) => {
      item.style.order = String(primaryItems.length + order)
    })
}

function railItemScore(item: HTMLElement, history: ReaderHistoryItem[], index: number): number {
  const kind = item.dataset.homeRailKind ?? ''
  const id = item.dataset.homeArticleId ?? item.dataset.homeRailId ?? String(index)
  const category = item.dataset.homeCategorySlug ?? ''
  const tags = (item.dataset.homeTags ?? '')
    .split('|')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
  const seed = homeSeed()
  let score = seededNumber(`${seed}:${kind}:${id}:${index}`) * 3

  if (kind === 'ad') return score - 0.25

  history.slice(0, 50).forEach((entry, historyIndex) => {
    const recency = Math.max(1, 10 - historyIndex * 0.2)
    const weight = recency * Math.max(1, entry.views)
    if (entry.id === id) score -= weight * 2.5
    if (category && entry.category_slug === category) score += weight
    for (const tag of entry.tags) {
      if (tags.includes(tag.toLowerCase())) score += weight * 0.45
    }
  })

  return score
}

function homeSeed() {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const key = 'scoop_home_session_seed'
    const existing = window.sessionStorage.getItem(key)
    if (existing) return `${today}:${existing}`
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
    window.sessionStorage.setItem(key, next)
    return `${today}:${next}`
  } catch {
    return today
  }
}

function seededNumber(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

function findCenteredAd(rail: HTMLDivElement): HTMLElement | null {
  const railRect = rail.getBoundingClientRect()
  const center = railRect.left + railRect.width / 2
  const ads = rail.querySelectorAll<HTMLElement>('[data-home-rail-kind="ad"]')

  for (const ad of ads) {
    const rect = ad.getBoundingClientRect()
    if (rect.left <= center && rect.right >= center) return ad
  }

  return null
}
