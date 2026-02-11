'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface EditorialCommentProps extends React.HTMLAttributes<HTMLDivElement> {
  authorEmail: string
  body: string
  createdAt: string
  resolved?: boolean
  onResolve?: () => void
  onDelete?: () => void
}

export function EditorialComment({
  authorEmail,
  body,
  createdAt,
  resolved = false,
  onResolve,
  onDelete,
  className,
  ...props
}: EditorialCommentProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-sm transition-colors',
        resolved
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
          : 'border-border bg-card',
        className,
      )}
      {...props}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{authorEmail}</span>
        <span className="text-[10px] text-muted-foreground">{createdAt}</span>
      </div>
      <p className={cn('text-sm', resolved && 'line-through opacity-60')}>
        {body}
      </p>
      {(!resolved || onDelete) && (
        <div className="mt-2 flex gap-2">
          {!resolved && onResolve && (
            <button
              type="button"
              onClick={onResolve}
              className="rounded px-2 py-0.5 text-xs text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
            >
              Résoudre
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
