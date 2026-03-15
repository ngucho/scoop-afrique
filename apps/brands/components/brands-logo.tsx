'use client'

import Link from 'next/link'
import { GlitchText } from 'scoop'

const logoClassName = 'font-brasika text-base font-black uppercase leading-none tracking-tight sm:text-lg md:text-xl'

/** Red dot between SCOOP and AFRIQUE — explicit styling for visibility */
function LogoDot() {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--primary)] align-middle sm:h-2.5 sm:w-2.5"
      aria-hidden
    />
  )
}

export function BrandsLogo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Scoop Afrique — Accueil"
    >
      <GlitchText text="SCOOP" as="span" className={`${logoClassName} text-foreground`} scramble={false} />
      <LogoDot />
      {/* Mobile: only SCOOP. — Desktop: SCOOP. AFRIQUE */}
      <span className="hidden sm:inline">
        <GlitchText text="AFRIQUE" as="span" className={`${logoClassName} text-primary`} scramble={false} />
      </span>
    </Link>
  )
}
