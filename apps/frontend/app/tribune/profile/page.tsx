import type { Metadata } from 'next'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { TribuneMyProfile } from '@/components/reader/tribune/TribuneMyProfile'
import { apiGet } from '@/lib/api/client'
import type { Category } from '@/lib/api/types'
import { config } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Mon profil Tribune',
  description: 'Profil lecteur et mur de vos notes.',
  alternates: { canonical: `${config.siteUrl}/tribune/profile` },
}

export default async function TribuneProfilePage() {
  let categories: Category[] = []
  try {
    const res = await apiGet<{ data: Category[] }>('/categories', { revalidate: 600 })
    categories = res.data ?? []
  } catch {
    categories = []
  }

  return (
    <ReaderLayout variant="tribune">
      <TribuneMyProfile categories={categories} />
    </ReaderLayout>
  )
}
