'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface MarqueeBandProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  direction?: 'left' | 'right'
  speed?: number
  repeat?: number
}

export function MarqueeBand({
  text,
  direction = 'left',
  speed = 20,
  repeat = 10,
  className,
  ...props
}: MarqueeBandProps) {
  const repeatedText = Array(repeat).fill(text).join(' — ')
  return (
    <div
      className={cn(
        'overflow-hidden whitespace-nowrap border-y border-border bg-secondary py-4',
        className
      )}
      {...props}
    >
      <div
        className="inline-flex"
        style={{
          animation: `scoop-marquee ${speed}s linear infinite`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        <span className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-foreground">
          {repeatedText}
        </span>
        <span className="ml-8 font-sans text-sm font-bold uppercase tracking-[0.3em] text-foreground">
          {repeatedText}
        </span>
      </div>
    </div>
  )
}
