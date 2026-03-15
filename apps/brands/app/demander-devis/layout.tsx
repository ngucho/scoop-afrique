import type { Metadata } from 'next'

const BASE_URL = 'https://www.scoop-afrique.com'

export const metadata: Metadata = {
  title: 'Demander un devis',
  description:
    'Demandez un devis personnalisé pour vos projets : couverture événementielle, publication sponsorisée, interview, partenariat de marque. Réponse sous 24-48h.',
  alternates: { canonical: `${BASE_URL}/demander-devis` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/demander-devis`,
    title: 'Demander un devis | Scoop Afrique',
    description: 'Formulaire de demande de devis. Couverture, publication, interview, partenariat.',
    siteName: 'Scoop Afrique',
  },
  robots: { index: true, follow: true },
}

export default function DemanderDevisLayout({ children }: { children: React.ReactNode }) {
  return children
}
