import type { Metadata } from 'next'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { TribuneHub } from '@/components/reader/TribuneHub'
import { apiGet } from '@/lib/api/client'
import type { ReaderContribution } from '@/lib/api/types'
import { config } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Tribune libre — contributions lecteurs',
  description:
    'Publiez vos analyses et signalez des événements. La communauté Scoop.Afrique — modération rédactionnelle.',
  alternates: { canonical: `${config.siteUrl}/tribune` },
}

export default async function TribunePage() {
  let initial: ReaderContribution[] = []
  let total = 0
  try {
    const res = await apiGet<{ data: ReaderContribution[]; total: number }>('/contributions?limit=24', {
      revalidate: 60,
    })
    initial = res.data ?? []
    total = res.total ?? 0
  } catch {
    // API offline
  }

  return (
    <ReaderLayout>
      <TribuneHub initialContributions={initial} initialTotal={total} />
    </ReaderLayout>
  )
}
