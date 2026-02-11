'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Timestamp } from '../atoms/Timestamp'

export interface MetaBarProps extends React.HTMLAttributes<HTMLDivElement> {
  dateTime?: string
  duration?: string
  viewCount?: number | string
  tags?: string[]
}

const MetaBar = React.forwardRef<HTMLDivElement, MetaBarProps>(
  ({ className, dateTime, duration, viewCount, tags, ...props }, ref) => {
    const parts: React.ReactNode[] = []
    if (dateTime) parts.push(<Timestamp key="date" dateTime={dateTime} />)
    if (duration) parts.push(<span key="dur" className="text-sm">{duration}</span>)
    if (viewCount != null) parts.push(<span key="views" className="text-sm">{viewCount} vues</span>)
    if (tags?.length) {
      parts.push(
        <span key="tags" className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="text-xs">#{t}</span>
          ))}
        </span>
      )
    }
    if (parts.length === 0) return null
    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground', className)}
        {...props}
      >
        {parts.map((el, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <span aria-hidden>·</span> : null}
            {el}
          </React.Fragment>
        ))}
      </div>
    )
  }
)
MetaBar.displayName = 'MetaBar'

export { MetaBar }
