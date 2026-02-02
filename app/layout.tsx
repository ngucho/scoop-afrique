import React from "react"
import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"], 
  variable: '--font-mono',
  display: 'swap',
});

const BASE_URL = 'https://scoop-afrique.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Scoop.Afrique - Le media digital qui decrypte l\'Afrique autrement',
    template: '%s | Scoop.Afrique',
  },
  description: 'Scoop.Afrique est le media digital africain nouvelle generation. Actualite internationale, pop culture, sport, politique, economie et divertissement. Plus de 1.25M d\'abonnes nous font confiance.',
  keywords: [
    'Scoop Afrique',
    'Scoop.Afrique',
    'media africain',
    'actualite Afrique',
    'news Afrique',
    'Cote d\'Ivoire',
    'Afrique francophone',
    'pop culture africaine',
    'sport africain',
    'divertissement Afrique',
    'media digital',
    'actualite internationale',
  ],
  authors: [{ name: 'Scoop.Afrique', url: BASE_URL }],
  creator: 'Scoop.Afrique',
  publisher: 'Scoop.Afrique',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'Scoop.Afrique',
    title: 'Scoop.Afrique - Le media digital qui decrypte l\'Afrique autrement',
    description: 'Scoop.Afrique est le media digital africain nouvelle generation. Actualite internationale, pop culture, sport, politique, economie et divertissement.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Scoop.Afrique - Le media digital africain',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scoop.Afrique - Le media digital qui decrypte l\'Afrique autrement',
    description: 'Scoop.Afrique est le media digital africain nouvelle generation. Actualite internationale, pop culture, sport, politique, economie et divertissement.',
    images: ['/og-image.png'],
    creator: '@ScoopAfrique',
    site: '@ScoopAfrique',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // other: {
    //   'msvalidate.01': 'your-bing-verification-code',
    // },
  },
  category: 'news',
    generator: 'v0.app'
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

// JSON-LD Structured Data
function JsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Scoop.Afrique',
    alternateName: ['Scoop Afrique', 'ScoopAfrique'],
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${BASE_URL}/og-image.png`,
    description: 'Le media digital qui decrypte l\'Afrique autrement. Actualite internationale, pop culture, sport, politique, economie et divertissement.',
    foundingDate: '2020',
    sameAs: [
      'https://www.tiktok.com/@Scoop.Afrique',
      'https://www.facebook.com/scoop.afrique',
      'https://www.instagram.com/Scoop.Afrique',
      'https://www.youtube.com/@Scoop.Afrique',
      'https://www.threads.net/@Scoop.Afrique',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'Contact@scoop-afrique.com',
      contactType: 'customer service',
      availableLanguage: ['French', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CI',
      addressLocality: 'Abidjan',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'Scoop.Afrique',
    description: 'Le media digital qui decrypte l\'Afrique autrement',
    publisher: {
      '@id': `${BASE_URL}/#organization`,
    },
    inLanguage: 'fr-FR',
    // Uncomment when search is implemented
    // potentialAction: {
    //   '@type': 'SearchAction',
    //   target: {
    //     '@type': 'EntryPoint',
    //     urlTemplate: `${BASE_URL}/recherche?q={search_term_string}`,
    //   },
    //   'query-input': 'required name=search_term_string',
    // },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="fr" 
      className="dark" 
      suppressHydrationWarning
    >
      <head>
        <JsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${spaceGrotesk.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
