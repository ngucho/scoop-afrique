'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

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
  const pausedAdRef = useRef<string | null>(null)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    let frame = 0
    let last = performance.now()

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
      if (!reducedMotion && now >= pauseUntilRef.current && !rail.matches(':hover') && !rail.matches(':focus-within')) {
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
    return () => cancelAnimationFrame(frame)
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
