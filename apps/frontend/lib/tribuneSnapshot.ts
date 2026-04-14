import { apiGet } from '@/lib/api/client'
import type { ReaderContribution } from '@/lib/api/types'

export async function fetchTribuneSnapshotContributions(limit = 5): Promise<ReaderContribution[]> {
  try {
    const res = await apiGet<{ data: ReaderContribution[]; next_cursor?: string | null }>(
      `/contributions?limit=${limit}&sort=latest`,
      { revalidate: 60 },
    )
    return res.data ?? []
  } catch {
    return []
  }
}

export function contributionExcerpt(body: string, maxLen = 96): string {
  const t = body.replace(/\s+/g, ' ').trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`
}
