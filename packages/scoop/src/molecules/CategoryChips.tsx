'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface CategoryChipItem {
  id: string
  label: string
  href?: string
}

export interface CategoryChipsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  items: CategoryChipItem[]
  activeId?: string
  onSelect?: (id: string) => void
}

const CategoryChips = React.forwardRef<HTMLDivElement, CategoryChipsProps>(
  ({ className, items, activeId, onSelect, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-label="Catégories"
      className={cn('flex flex-wrap gap-2', className)}
      {...props}
    >
      {items.map((item) => {
        const isActive = activeId === item.id
        const content = (
          <>
            <span className="font-sans text-sm font-medium uppercase tracking-wider">
              {item.label}
            </span>
          </>
        )
        const baseClass = cn(
          'inline-flex items-center border px-4 py-2 font-sans text-sm font-medium uppercase tracking-wider transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isActive
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-foreground hover:border-primary hover:text-primary'
        )
        if (item.href && !onSelect) {
          return (
            <a
              key={item.id}
              href={item.href}
              className={baseClass}
              role="tab"
              aria-selected={isActive}
            >
              {content}
            </a>
          )
        }
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={baseClass}
            onClick={() => onSelect?.(item.id)}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
)
CategoryChips.displayName = 'CategoryChips'

export { CategoryChips }
