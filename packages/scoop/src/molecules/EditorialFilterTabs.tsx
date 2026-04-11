'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface EditorialFilterTab {
  id: string
  label: string
  active: boolean
  onSelect: () => void
}

export interface EditorialFilterTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: EditorialFilterTab[]
}

/** Filtres type onglets (texte + soulignement primary). */
export function EditorialFilterTabs({ tabs, className, ...props }: EditorialFilterTabsProps) {
  return (
    <div className={cn('flex gap-4 text-sm font-bold', className)} role="tablist" {...props}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.active}
          className={cn(
            'border-b-2 border-transparent pb-1 transition-colors',
            t.active ? 'border-primary text-primary' : 'text-muted-foreground hover:text-primary'
          )}
          onClick={t.onSelect}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
