'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '../utils/cn'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, separator, ...props }, ref) => (
    <nav ref={ref} aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          const sep = separator ?? <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 ? sep : null}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={isLast ? 'font-medium text-foreground' : 'text-muted-foreground'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
)
Breadcrumb.displayName = 'Breadcrumb'

export { Breadcrumb }
