'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from 'scoop'

const SCROLL_AFTER = 280

export function StickyDevisBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const onScroll = () => {
      if (reduced) {
        setVisible(window.scrollY > 80)
        return
      }
      setVisible(window.scrollY > SCROLL_AFTER)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      )}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto flex max-w-lg flex-col gap-2 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:px-5">
        <p className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
          <span className="font-medium text-foreground">Partenariat ou campagne ?</span> Brief en 2 minutes — réponse sous 24–48 h.
        </p>
        <Link
          href="/demander-devis"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
        >
          Demander un devis
        </Link>
      </div>
    </div>
  )
}
