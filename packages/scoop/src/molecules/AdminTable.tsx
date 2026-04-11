'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AdminTableProps {
  /** Libellés colonnes */
  columns: { label: string; align?: 'left' | 'right' }[]
  /** Une ligne = une liste de cellules (déjà formatées). */
  rows: React.ReactNode[][]
  emptyMessage?: string
  className?: string
}

/** Tableau admin dense — bordures sémantiques, en-têtes `muted`. */
export function AdminTable({ columns, rows, emptyMessage, className }: AdminTableProps) {
  if (rows.length === 0 && emptyMessage) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className={cn('overflow-x-auto rounded-md border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  'px-3 py-2',
                  col.align === 'right' ? 'text-right' : 'text-left'
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri} className="border-b border-border/60 last:border-0">
              {cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'px-3 py-2',
                    columns[ci]?.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
