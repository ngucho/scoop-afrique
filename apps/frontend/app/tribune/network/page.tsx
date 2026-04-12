import type { Metadata } from 'next'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { TribuneNetworkClient } from '@/components/reader/tribune/TribuneNetworkClient'
import { config } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Réseau Tribune',
  description: 'Abonnés et abonnements sur la Tribune.',
  alternates: { canonical: `${config.siteUrl}/tribune/network` },
}

export default function TribuneNetworkPage() {
  return (
    <ReaderLayout variant="tribune">
      <TribuneNetworkClient />
    </ReaderLayout>
  )
}
