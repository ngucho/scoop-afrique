'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export interface SubtleParallaxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Multiplier for pointer offset (0–1 typical). */
  intensity?: number
}

/**
 * Subtle pointer-based parallax — disabled when `prefers-reduced-motion` is set.
 */
export function SubtleParallax({
  className,
  intensity = 0.5,
  onMouseMove,
  onMouseLeave,
  style,
  ...props
}: SubtleParallaxProps) {
  const reduced = usePrefersReducedMotion()

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(e)
    if (reduced || e.currentTarget === null) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    const range = 12
    const tx = -nx * range * intensity
    const ty = -ny * range * intensity
    el.style.setProperty('--parallax-x', `${tx}px`)
    el.style.setProperty('--parallax-y', `${ty}px`)
  }

  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(e)
    if (reduced) return
    e.currentTarget.style.setProperty('--parallax-x', '0px')
    e.currentTarget.style.setProperty('--parallax-y', '0px')
  }

  return (
    <div
      className={cn('scoop-motion-parallax', className)}
      style={{
        transform: reduced
          ? undefined
          : 'translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0)',
        ...style,
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...props}
    />
  )
}
