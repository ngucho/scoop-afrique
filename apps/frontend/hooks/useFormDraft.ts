'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Persists form state to localStorage so incomplete drafts survive navigation.
 * Call clearDraft() after a successful submit.
 */
export function useFormDraftState<T extends Record<string, unknown>>(
  storageKey: string,
  getDefaults: () => T,
): readonly [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(() => {
    const defaults = getDefaults()
    if (typeof window === 'undefined') return defaults
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaults
      const parsed = JSON.parse(raw) as Partial<T>
      return { ...defaults, ...parsed }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      /* quota / private mode */
    }
  }, [storageKey, state])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
    setState(getDefaults())
  }, [storageKey, getDefaults])

  return [state, setState, clearDraft] as const
}
