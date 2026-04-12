import { cache } from 'react'
import { apiGet } from '@/lib/api/client'

export type ReaderEmptyAdCopy = { title: string | null; subtitle: string | null }

async function fetchReaderChromeUncached(): Promise<ReaderEmptyAdCopy> {
  try {
    const json = await apiGet<{ data: { empty_ad: ReaderEmptyAdCopy } }>('/chrome', { revalidate: 30 })
    return json.data?.empty_ad ?? { title: null, subtitle: null }
  } catch {
    return { title: null, subtitle: null }
  }
}

export const fetchReaderChromeFallback = cache(fetchReaderChromeUncached)
