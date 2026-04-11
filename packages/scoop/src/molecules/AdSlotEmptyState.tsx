'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AdSlotEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  slotKey: string
  title?: string
  subtitle?: string
}

/** Placeholder d’emplacement publicitaire — tokens sémantiques du thème. */
export function AdSlotEmptyState({
  slotKey,
  title = 'Espace publicitaire',
  subtitle,
  className,
  ...props
}: AdSlotEmptyStateProps) {
  return (
    <div
      className={cn('flex min-h-[100px] flex-col items-center justify-center gap-1 text-center', className)}
      {...props}
    >
      <span className="text-xs text-muted-foreground">{title}</span>
      <span className="text-xs text-muted-foreground/80">{subtitle ?? `Emplacement ${slotKey}`}</span>
    </div>
  )
}
