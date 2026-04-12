'use client'

import { createContext, useContext } from 'react'
import type { ReaderEmptyAdCopy } from '@/lib/readerChrome'

const ReaderAdFallbackContext = createContext<ReaderEmptyAdCopy>({ title: null, subtitle: null })

export function ReaderAdFallbackProvider({
  value,
  children,
}: {
  value: ReaderEmptyAdCopy
  children: React.ReactNode
}) {
  return <ReaderAdFallbackContext.Provider value={value}>{children}</ReaderAdFallbackContext.Provider>
}

export function useReaderAdFallbackCopy(): ReaderEmptyAdCopy {
  return useContext(ReaderAdFallbackContext)
}
