'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from 'scoop'

const STORAGE_KEY = 'scoop_cookie_consent'
type Consent = 'accepted' | 'rejected'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Consent | null
      return stored !== 'accepted' && stored !== 'rejected'
    } catch {
      return true
    }
  })

  const save = (value: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
      setVisible(false)
    } catch {
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Choix des cookies"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[var(--glass-border)] bg-[var(--glass-bg)] px-6 py-4 shadow-[var(--shadow-xl)] backdrop-blur-[var(--glass-blur)] sm:px-8 md:px-10"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          Nous utilisons des cookies pour le bon fonctionnement du site, la mémorisation de vos préférences et
          l&apos;analyse d&apos;audience. En cliquant sur &quot;Tout accepter&quot;, vous consentez à leur utilisation.{' '}
          <Link
            href="/politique-de-confidentialite"
            className="font-medium text-primary underline underline-offset-2 hover:no-underline"
          >
            Politique de confidentialité
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button variant="outline" size="default" onClick={() => save('rejected')}>
            Tout refuser
          </Button>
          <Button variant="default" size="default" onClick={() => save('accepted')}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  )
}
