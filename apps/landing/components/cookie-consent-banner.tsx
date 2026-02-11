'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'scoop_cookie_consent'
type Consent = 'accepted' | 'rejected'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Consent | null
      if (stored !== 'accepted' && stored !== 'rejected') setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

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
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 px-4 py-4 shadow-lg backdrop-blur sm:px-6 md:px-8"
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
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => save('rejected')}
            className="rounded-md border-2 border-border bg-transparent px-4 py-2 font-sans text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={() => save('accepted')}
            className="rounded-md border-2 border-primary bg-primary px-4 py-2 font-sans text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:opacity-90"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  )
}
