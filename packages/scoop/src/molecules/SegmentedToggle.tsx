'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface SegmentedToggleOption {
  id: string
  label: string
  active: boolean
  onSelect: () => void
}

export interface SegmentedToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  options: SegmentedToggleOption[]
  size?: 'sm' | 'md'
}

/** Deux options ou plus — style pill (ex. Tribune / Événement). */
export function SegmentedToggle({ options, size = 'sm', className, ...props }: SegmentedToggleProps) {
  const sm = size === 'sm'
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" {...props}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={cn(
            'rounded-full font-bold uppercase tracking-wide transition-colors',
            sm ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm',
            o.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
          onClick={o.onSelect}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
