'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

const DISMISS_KEY = 'scoop-partnership-strip-dismissed'

type Props = {
  /** Contrôlé par le CMS (homepage_sections.partnership_strip.is_visible). */
  cmsEnabled: boolean
}

export function PartnershipStrip({ cmsEnabled }: Props) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (!cmsEnabled) return
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [cmsEnabled])

  const close = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  if (!cmsEnabled || dismissed) return null

  return (
    <div className="border-b border-border bg-gradient-to-r from-primary/15 via-background to-primary/10 px-4 py-3 text-center text-foreground md:px-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
        <p className="text-sm text-foreground/90">
          <span className="font-semibold">Marque ou institution ?</span> Couvertures, contenus sponsorisés et partenariats
          long terme avec +1,4 M d’abonnés cumulés — brief sur{' '}
          <span className="whitespace-nowrap font-medium">brands.scoop-afrique.com</span>.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="https://brands.scoop-afrique.com/demander-devis"
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
            target="_blank"
            rel="noopener noreferrer"
          >
            Demander un devis
          </Link>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            aria-label="Fermer la bannière partenariats"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
