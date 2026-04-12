'use client'

import { PenLine } from 'lucide-react'

export interface TribuneFABProps {
  visible: boolean
  onClick: () => void
  label?: string
}

export function TribuneFAB({ visible, onClick, label = 'Nouvelle note' }: TribuneFABProps) {
  if (!visible) return null
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <PenLine className="h-6 w-6" aria-hidden />
    </button>
  )
}
