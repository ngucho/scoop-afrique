'use client'

/**
 * SwipeHandler — Detects touch swipe gestures on mobile.
 *
 * Usage:
 *   <SwipeHandler onSwipeLeft={() => goNext()} onSwipeRight={() => goPrev()}>
 *     <YourContent />
 *   </SwipeHandler>
 *
 * Features:
 * - Minimum threshold to prevent accidental swipes
 * - Velocity detection for snappy UX
 * - Passive touch listeners for scroll performance
 */
import { useRef, useCallback, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react'

interface SwipeHandlerProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  /** Minimum distance in px to register a swipe (default: 50) */
  threshold?: number
  className?: string
}

export function SwipeHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
}: SwipeHandlerProps) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
  }, [])

  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      if (!touchStart.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = touch.clientY - touchStart.current.y
      const dt = Date.now() - touchStart.current.time
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // Require minimum distance and reasonable time (< 500ms)
      if (dt > 500) {
        touchStart.current = null
        return
      }

      if (absDx > absDy && absDx > threshold) {
        // Horizontal swipe
        if (dx < 0) onSwipeLeft?.()
        else onSwipeRight?.()
      } else if (absDy > absDx && absDy > threshold) {
        // Vertical swipe
        if (dy < 0) onSwipeUp?.()
        else onSwipeDown?.()
      }

      touchStart.current = null
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]
  )

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}
