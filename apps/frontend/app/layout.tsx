import type { Metadata } from 'next'
import { Manrope, Newsreader } from 'next/font/google'
import { ThemeProvider } from 'scoop'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { ReaderEngagementToast } from '@/components/reader/ReaderEngagementToast'
import { SiteJsonLd } from '@/components/seo/SiteJsonLd'
import { config } from '@/lib/config'
import './globals.css'
import '@/lib/animations.css'

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

const SITE_URL = config.siteUrl

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.ico',
  },
  applicationName: 'Scoop.Afrique',
  title: { default: 'Scoop.Afrique — Actualités & articles panafricains', template: '%s | Scoop.Afrique' },
  description:
    "Le média digital qui décrypte l'Afrique autrement. Actualités, politique, culture, sport, société. Articles, newsletter, vidéos et podcasts.",
  keywords: [
    'Scoop Afrique',
    'Scoop.Afrique',
    'www scoop afrique',
    'actualités Afrique',
    'actualité panafricaine',
    'média panafricain',
    'presse africaine',
    'information Afrique',
    'news Afrique',
    'décryptage Afrique',
    'reportage Afrique',
    'Côte d\'Ivoire',
    'Abidjan',
    'UEMOA',
    'CEDEAO',
    'culture africaine',
    'politique Afrique',
    'économie Afrique',
    'sport Afrique',
    'brands scoop afrique',
  ],
  authors: [{ name: 'Scoop.Afrique', url: SITE_URL }],
  creator: 'Scoop.Afrique',
  publisher: 'Scoop.Afrique',
  category: 'news',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'Scoop.Afrique',
    title: "Scoop.Afrique — Actualités & articles panafricains",
    description: "Le média digital qui décrypte l'Afrique autrement. Actualités, culture, sport, société.",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Scoop.Afrique — Actualités panafricaines",
    description: "Le média digital qui décrypte l'Afrique autrement.",
    creator: '@ScoopAfrique',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/rss.xml`,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${manrope.variable} ${newsreader.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <SiteJsonLd />
        <Auth0Provider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <ReaderEngagementToast />
            <CookieConsentBanner />
          </ThemeProvider>
        </Auth0Provider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
