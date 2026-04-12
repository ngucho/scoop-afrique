import type { Metadata } from 'next'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { TribunePublicProfile } from '@/components/reader/tribune/TribunePublicProfile'
import { config } from '@/lib/config'

type Props = { params: Promise<{ pseudo: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pseudo } = await params
  return {
    title: `@${pseudo} — Tribune`,
    description: `Profil Tribune et notes de @${pseudo}.`,
    alternates: { canonical: `${config.siteUrl}/tribune/u/${pseudo}` },
  }
}

export default async function TribuneUserPage({ params }: Props) {
  const { pseudo } = await params
  return (
    <ReaderLayout variant="tribune">
      <TribunePublicProfile pseudo={pseudo} />
    </ReaderLayout>
  )
}
