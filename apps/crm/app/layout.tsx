import type { Metadata } from 'next'
import { ThemeProvider } from 'scoop'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'CRM', template: '%s | Scoop Afrique CRM' },
  description: 'CRM backoffice for Scoop Afrique.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Auth0Provider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  )
}
