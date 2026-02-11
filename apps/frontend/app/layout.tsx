import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from 'scoop'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import './globals.css'
import '@/lib/animations.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Scoop.Afrique', template: '%s | Scoop.Afrique' },
  description: "Le media digital qui décrypte l'Afrique autrement. Articles, actualités, newsletter.",
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
