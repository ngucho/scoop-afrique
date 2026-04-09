'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface TickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Seconds for one full cycle (smaller = faster). */
  speed?: number
  direction?: 'left' | 'right'
  /** Pause scrolling on hover. */
  pauseOnHover?: boolean
}

/**
 * Horizontal ticker — duplicates content for a seamless loop (`scoop-marquee`).
 */
export function Ticker({
  children,
  speed = 28,
  direction = 'left',
  className,
  pauseOnHover = true,
  style,
  ...props
}: TickerProps) {
  const track = (
    <div className="flex basis-1/2 shrink-0 grow-0 items-center justify-around gap-[var(--space-8)] px-[var(--space-4)]">
      {children}
    </div>
  )

  return (
    <div
      role="marquee"
      aria-live="off"
      className={cn(
        'overflow-hidden border-y border-[var(--glass-border)]',
        'bg-[var(--glass-bg)]/80 py-3 backdrop-blur-[var(--glass-blur-sm)]',
        pauseOnHover && 'group',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'scoop-marquee flex w-[200%]',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{
          animationDuration: `${speed}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
          ...style,
        }}
      >
        {track}
        {track}
      </div>
    </div>
  )
}
