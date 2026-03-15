import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from 'scoop'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { config } from '@/lib/config'
import './globals.css'
import '@/lib/animations.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const SITE_URL = config.siteUrl

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Scoop.Afrique — Actualités & articles panafricains', template: '%s | Scoop.Afrique' },
  description:
    "Le média digital qui décrypte l'Afrique autrement. Actualités, politique, culture, sport, société. Articles, newsletter, vidéos et podcasts.",
  keywords: [
    'Scoop Afrique',
    'actualités Afrique',
    'média panafricain',
    'news Afrique',
    'Côte d\'Ivoire',
    'Abidjan',
    'culture africaine',
    'politique Afrique',
    'sport Afrique',
  ],
  authors: [{ name: 'Scoop.Afrique', url: SITE_URL }],
  creator: 'Scoop.Afrique',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'Scoop.Afrique',
    title: "Scoop.Afrique — Actualités & articles panafricains",
    description: "Le média digital qui décrypte l'Afrique autrement. Actualités, culture, sport, société.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Scoop.Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Scoop.Afrique — Actualités panafricaines",
    description: "Le média digital qui décrypte l'Afrique autrement.",
    images: ['/og-image.png'],
    creator: '@ScoopAfrique',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: SITE_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <Auth0Provider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <CookieConsentBanner />
          </ThemeProvider>
        </Auth0Provider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
