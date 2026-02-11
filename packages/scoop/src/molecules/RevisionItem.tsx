'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface RevisionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  version: number
  createdAt: string
  authorEmail?: string | null
  isActive?: boolean
  onPreview?: () => void
  onRestore?: () => void
}

export function RevisionItem({
  version,
  createdAt,
  authorEmail,
  isActive = false,
  onPreview,
  onRestore,
  className,
  ...props
}: RevisionItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-muted/50',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">
          Version {version}
        </span>
        <span className="text-xs text-muted-foreground">
          {createdAt}
          {authorEmail && ` · ${authorEmail}`}
        </span>
      </div>
      <div className="flex gap-1">
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            Voir
          </button>
        )}
        {onRestore && (
          <button
            type="button"
            onClick={onRestore}
            className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            Restaurer
          </button>
        )}
      </div>
    </div>
  )
}
