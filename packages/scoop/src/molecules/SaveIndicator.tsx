'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

const STATE_MAP: Record<SaveState, { label: string; dotClass: string }> = {
  idle: { label: '', dotClass: '' },
  saving: { label: 'Enregistrement...', dotClass: 'bg-amber-400 animate-pulse' },
  saved: { label: 'Enregistré', dotClass: 'bg-green-500' },
  error: { label: 'Erreur', dotClass: 'bg-red-500' },
  offline: { label: 'Sauvegardé localement', dotClass: 'bg-blue-500' },
}

export interface SaveIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  state: SaveState
  /** Optional version number */
  version?: number
}

export function SaveIndicator({ state, version, className, ...props }: SaveIndicatorProps) {
  if (state === 'idle') return null
  const info = STATE_MAP[state]
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-xs text-muted-foreground',
        className,
      )}
      {...props}
    >
      <span className={cn('h-2 w-2 rounded-full', info.dotClass)} />
      <span>{info.label}</span>
      {version !== undefined && state === 'saved' && (
        <span className="text-[10px] opacity-60">v{version}</span>
      )}
    </div>
  )
}
