import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Manrope, Newsreader, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { BrandsHeader } from '@/components/brands-header'
import { StickyDevisBar } from '@/components/sticky-devis-bar'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const brasika = localFont({
  src: '../public/fonts/brasika-display-trial.otf',
  variable: '--font-brasika',
  display: 'swap',
})

const BASE_URL = 'https://brands.scoop-afrique.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Scoop Afrique — Partenariats, publicité & couverture médiatique",
    template: '%s | Scoop Afrique',
  },
  description:
    "Scoop Afrique — média panafricain (Abidjan). +1,4 M abonnés cumulés. Grille tarifaire V2 (mars 2026) : publications dès 50 000 FCFA, couvertures, promos, interviews, brand deals. Devis en 24–48 h.",
  keywords: [
    'Scoop Afrique',
    'media africain',
    'partenariat médiatique',
    'publicité Afrique',
    'sponsoring média',
    'couverture événement',
    'contenu sponsorisé',
    'campagne digitale',
    "Côte d'Ivoire",
    'Abidjan',
    'annonceurs',
    'TikTok Afrique',
  ],
  authors: [{ name: 'Scoop.Afrique', url: BASE_URL }],
  creator: 'Scoop.Afrique',
  publisher: 'Scoop.Afrique',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'Scoop Afrique',
    title: "Scoop Afrique — Partenariats, publicité & couverture médiatique",
    description:
      "+1,4 M abonnés cumulés. Grille V2 mars 2026 — publications dès 50 K FCFA, couvertures, partenariats. Devis rapide.",
    images: [{ url: '/images/hero-brands.png', width: 1200, height: 630, alt: 'Scoop Afrique — Partenariats' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Scoop Afrique — Partenariats & publicité",
    description:
      "+1,4 M abonnés cumulés. Offres annonceurs et programmes éditoriaux. Devis sous 24–48 h.",
    images: ['/images/hero-brands.png'],
    creator: '@ScoopAfrique',
    site: '@ScoopAfrique',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  category: 'news',
  generator: 'Next.js',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'dark light',
}

function JsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Scoop.Afrique',
    alternateName: ['Scoop Afrique', 'ScoopAfrique'],
    url: BASE_URL,
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png`, width: 512, height: 512 },
    image: `${BASE_URL}/images/hero-brands.png`,
    description:
      "Devenir le média de référence de la jeunesse africaine francophone. Donner une voix et une vitrine à l'Afrique en produisant des contenus audiovisuels impactants.",
    foundingDate: '2025',
    sameAs: [
      'https://www.tiktok.com/@Scoop.Afrique',
      'https://www.facebook.com/profile.php?id=61568464568442',
      'https://www.instagram.com/Scoop.Afrique',
      'https://www.youtube.com/@Scoop.Afrique',
      'https://www.threads.net/@Scoop.Afrique',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@scoop-afrique.com',
      contactType: 'customer service',
      availableLanguage: ['French', 'English'],
    },
    address: { '@type': 'PostalAddress', addressCountry: 'CI', addressLocality: 'Abidjan' },
  }
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'Scoop.Afrique',
    description: "Le média de référence de la jeunesse africaine francophone",
    publisher: { '@id': `${BASE_URL}/#organization` },
    inLanguage: 'fr-FR',
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    </>
  )
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${manrope.variable} ${newsreader.variable}`}>
      <head>
        <JsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geistMono.variable} ${brasika.variable} font-sans antialiased`}>
        <BrandsHeader />
        {children}
        <StickyDevisBar />
        <CookieConsentBanner />
        <Analytics />
      </body>
    </html>
  )
}
