'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

const SESSION_DISMISS_KEY = 'scoop_reader_engagement_dismissed'
/** Visible time (seconds) before showing the toast again after auto-hide. */
const RE_SHOW_AFTER_SEC = 5 * 60
/** Delay before first appearance (ms). */
const INITIAL_DELAY_MS = 500
/** Auto-hide after (ms) if user does not close manually. */
const AUTO_HIDE_MS = 12_000

const HIDE_PATH_PREFIXES = [
  '/newsletter',
  '/mentions-legales',
  '/politique-de-confidentialite',
  '/cgu',
  '/reader/auth',
]

function shouldSuppressForPath(pathname: string | null): boolean {
  if (!pathname) return true
  return HIDE_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function ReaderEngagementToast() {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState(false)
  /** After a toast auto-closes, count visible time for re-show. */
  const [countingEnabled, setCountingEnabled] = useState(false)
  const [initialConsumed, setInitialConsumed] = useState(false)
  const accumSecRef = useRef(0)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppress = shouldSuppressForPath(pathname)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === '1') setDismissed(true)
    } catch {
      /* ignore */
    }
  }, [])

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const openWithAutoHide = useCallback(() => {
    clearHideTimer()
    setOpen(true)
    hideTimerRef.current = setTimeout(() => {
      setOpen(false)
      setCountingEnabled(true)
      accumSecRef.current = 0
      hideTimerRef.current = null
    }, AUTO_HIDE_MS)
  }, [clearHideTimer])

  const handleManualClose = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
    setOpen(false)
    setCountingEnabled(false)
    clearHideTimer()
  }, [clearHideTimer])

  /* First appearance on an allowed path (re-tries if user was on a suppressed path during delay). */
  useEffect(() => {
    if (suppress || dismissed || initialConsumed) return
    const t = window.setTimeout(() => {
      if (shouldSuppressForPath(pathname)) return
      setInitialConsumed(true)
      openWithAutoHide()
    }, INITIAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [suppress, dismissed, initialConsumed, pathname, openWithAutoHide])

  useEffect(() => {
    if (suppress && open) {
      setOpen(false)
      clearHideTimer()
    }
  }, [suppress, open, clearHideTimer])

  /* Re-show after RE_SHOW_AFTER_SEC of visible, active time on the page */
  useEffect(() => {
    if (suppress || dismissed || !countingEnabled || open) return

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      accumSecRef.current += 1
      if (accumSecRef.current >= RE_SHOW_AFTER_SEC) {
        accumSecRef.current = 0
        setCountingEnabled(false)
        openWithAutoHide()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [suppress, dismissed, countingEnabled, open, openWithAutoHide])

  if (suppress || dismissed || !open) return null

  return (
    <div
      role="region"
      aria-label="S’abonner à Scoop.Afrique"
      className="fixed bottom-24 left-4 right-4 z-[95] max-w-md md:bottom-8 md:left-auto md:right-6"
    >
      <div className="relative rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-card/90">
        <button
          type="button"
          onClick={handleManualClose}
          className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fermer et ne plus afficher cette session"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="pr-8 text-sm font-medium text-foreground">
          Restez informé : newsletter gratuite et offres partenaires.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Fermer cette fenêtre masque l’invite jusqu’à votre prochaine visite.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/newsletter"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
          >
            Newsletter
          </Link>
          <a
            href="https://brands.scoop-afrique.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border-2 border-border bg-transparent px-3 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Offres & abonnements
          </a>
        </div>
      </div>
    </div>
  )
}
