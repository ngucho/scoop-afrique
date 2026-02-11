'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  review: { label: 'En révision', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  scheduled: { label: 'Programmé', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  published: { label: 'Publié', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  archived: { label: 'Archivé', className: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string
  /** Override the displayed label */
  label?: string
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const mapped = STATUS_MAP[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        mapped.className,
        className,
      )}
      {...props}
    >
      {label ?? mapped.label}
    </span>
  )
}
