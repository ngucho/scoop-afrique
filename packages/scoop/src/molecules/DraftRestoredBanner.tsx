'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface DraftRestoredBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  savedAt: string | number
  onRestore: () => void
  onDiscard: () => void
}

function formatAgo(savedAt: string | number): string {
  const diff = Date.now() - (typeof savedAt === 'number' ? savedAt : new Date(savedAt).getTime())
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export function DraftRestoredBanner({
  savedAt,
  onRestore,
  onDiscard,
  className,
  ...props
}: DraftRestoredBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        className,
      )}
      {...props}
    >
      <span>
        Un brouillon local a été trouvé ({formatAgo(savedAt)}). Voulez-vous le restaurer ?
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          Restaurer
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded bg-blue-200 px-3 py-1 text-xs font-medium hover:bg-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700"
        >
          Ignorer
        </button>
      </div>
    </div>
  )
}
