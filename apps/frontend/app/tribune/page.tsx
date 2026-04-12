import type { Metadata } from 'next'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { TribuneHub } from '@/components/reader/TribuneHub'
import { apiGet } from '@/lib/api/client'
import type { ReaderContribution } from '@/lib/api/types'
import { config } from '@/lib/config'
import { getReaderAccessToken, getReaderSession } from '@/lib/reader-auth0'
import { resolveTribuneAccess } from '@/lib/tribune-access'

export const metadata: Metadata = {
  title: 'Tribune libre — contributions lecteurs',
  description:
    'Publiez vos analyses et signalez des événements. La communauté Scoop.Afrique — modération rédactionnelle.',
  alternates: { canonical: `${config.siteUrl}/tribune` },
}

export default async function TribunePage() {
  let initial: ReaderContribution[] = []
  let initialNextCursor: string | null = null
  try {
    const res = await apiGet<{
      data: ReaderContribution[]
      next_cursor?: string | null
      total?: number
    }>('/contributions?limit=24', {
      revalidate: 60,
    })
    initial = res.data ?? []
    initialNextCursor = res.next_cursor ?? null
  } catch {
    // API offline
  }

  const session = await getReaderSession()
  const token = session?.user ? await getReaderAccessToken() : null
  const initialTribuneAccess = resolveTribuneAccess(token?.permissions)

  return (
    <ReaderLayout variant="tribune">
      <TribuneHub
        initialContributions={initial}
        initialNextCursor={initialNextCursor}
        initialTribuneAccess={initialTribuneAccess}
        initialAuthenticated={!!session?.user}
      />
    </ReaderLayout>
  )
}
