import type { Metadata } from 'next'
import { GlobePerceptionClient } from './GlobePerceptionClient'

export const metadata: Metadata = {
  title: 'Globe — perception des projections',
  robots: { index: false, follow: false },
}

export default function GlobePerceptionPage() {
  return <GlobePerceptionClient />
}
