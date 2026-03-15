import type { Metadata } from 'next'

const BASE_URL = 'https://www.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Stratégie éditoriale 2026 | Scoop Afrique',
  description:
    "Découvrez la stratégie éditoriale Scoop Afrique 2026 : vision, axes stratégiques, projets par rubrique (Actualité, Pop culture, Sport, Politique, Économie, Divertissement) et formats plateformes.",
  alternates: { canonical: `${BASE_URL}/strategie-editoriale` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/strategie-editoriale`,
    title: 'Stratégie éditoriale 2026 | Scoop Afrique',
    description: 'Notre feuille de route pour devenir le média de référence de la jeunesse africaine francophone.',
    siteName: 'Scoop Afrique',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Scoop Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stratégie éditoriale 2026 | Scoop Afrique',
    description: 'Notre feuille de route éditoriale.',
  },
}

export default function StrategieEditorialeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
