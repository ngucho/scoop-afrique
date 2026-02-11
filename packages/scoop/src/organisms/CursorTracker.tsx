'use client'

import * as React from 'react'
import { useEffect, useState, useCallback } from 'react'
import { cn } from '../utils/cn'

/**
 * Simple cursor: one ring + dot. No trail to avoid distraction.
 */
export interface CursorTrackerProps {
  className?: string
  ringSize?: number
  dotSize?: number
  ringSizeHover?: number
}

export function CursorTracker({
  className,
  ringSize = 40,
  dotSize = 8,
  ringSizeHover = 56,
}: CursorTrackerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY })
    setIsVisible(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    const checkHover = () => {
      const hovered = document.querySelectorAll('a:hover, button:hover, [data-hover]:hover')
      setIsHovering(hovered.length > 0)
    }
    const interval = setInterval(checkHover, 50)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearInterval(interval)
    }
  }, [handleMouseMove, handleMouseLeave])

  if (typeof window === 'undefined') return null

  const ring = isHovering ? ringSizeHover : ringSize

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[9999] transition-opacity duration-150 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      aria-hidden
    >
      <div
        className="absolute rounded-full border-2 border-primary transition-all duration-300"
        style={{
          width: ring,
          height: ring,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className="absolute rounded-full bg-primary transition-all duration-150"
        style={{
          width: dotSize,
          height: dotSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  )
}
