'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Separator } from '../atoms/Separator'

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  number?: string
  label: string
  labelClassName?: string
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, number, label, labelClassName, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-6', className)}
      {...props}
    >
      {number != null && (
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {number}
        </span>
      )}
      <Separator className="flex-1" />
      <span
        className={cn(
          'font-mono text-xs font-bold uppercase tracking-[0.3em] text-primary',
          labelClassName
        )}
      >
        {label}
      </span>
    </div>
  )
)
SectionHeader.displayName = 'SectionHeader'

export { SectionHeader }
