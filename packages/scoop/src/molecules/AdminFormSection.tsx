'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AdminFormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

/** Carte formulaire back-office (bordure + fond carte). */
export function AdminFormSection({ title, description, className, children, ...props }: AdminFormSectionProps) {
  return (
    <div className={cn('space-y-3 rounded-lg border border-border bg-card p-4', className)} {...props}>
      {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {children}
    </div>
  )
}
