'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface TimestampProps extends React.HTMLAttributes<HTMLTimeElement> {
  dateTime: string
  format?: 'relative' | 'date' | 'datetime'
  children?: React.ReactNode
}

const FULL_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Abidjan',
  timeZoneName: 'short',
}

const SHORT_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Africa/Abidjan',
}

function formatTimestamp(iso: string, format: 'relative' | 'date' | 'datetime'): string {
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso

    if (format === 'relative') {
      const diffS = Math.floor((Date.now() - date.getTime()) / 1000)
      if (diffS >= 0) {
        if (diffS < 60) return 'il y a quelques secondes'
        if (diffS < 3600) return `il y a ${Math.floor(diffS / 60)} min`
        if (diffS < 86400) return `il y a ${Math.floor(diffS / 3600)}h`
        if (diffS < 604800) return `il y a ${Math.floor(diffS / 86400)}j`
      }
      // Fall through to full format for older dates
    }

    const opts = format === 'date' ? SHORT_FORMAT : FULL_FORMAT
    return new Intl.DateTimeFormat('fr-FR', opts).format(date)
  } catch {
    return iso
  }
}

const Timestamp = React.forwardRef<HTMLTimeElement, TimestampProps>(
  ({ className, dateTime, format = 'date', children, ...props }, ref) => (
    <time
      ref={ref}
      dateTime={dateTime}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children ?? formatTimestamp(dateTime, format)}
    </time>
  ),
)
Timestamp.displayName = 'Timestamp'

export { Timestamp }
