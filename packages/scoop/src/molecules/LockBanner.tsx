'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface LockBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  lockerEmail: string
  /** Remaining minutes until lock expires (optional) */
  expiresInMin?: number
  onForceUnlock?: () => void
  canForceUnlock?: boolean
}

export function LockBanner({
  lockerEmail,
  expiresInMin,
  onForceUnlock,
  canForceUnlock = false,
  className,
  ...props
}: LockBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>
          Cet article est en cours d&apos;édition par <strong>{lockerEmail}</strong>
          {expiresInMin !== undefined && ` (expire dans ${expiresInMin} min)`}
        </span>
      </div>
      {canForceUnlock && onForceUnlock && (
        <button
          type="button"
          onClick={onForceUnlock}
          className="shrink-0 rounded bg-amber-200 px-3 py-1 text-xs font-medium hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700"
        >
          Forcer le déverrouillage
        </button>
      )}
    </div>
  )
}
