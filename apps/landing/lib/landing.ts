/**
 * SSR-safe class names for landing pages (no client-only scoop variants).
 * Keeps design consistent with scoop link/button variants.
 */
export const backLinkClassName =
  'group inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary [&>span]:h-px [&>span]:w-0 [&>span]:bg-primary [&>span]:transition-all [&>span]:duration-300 group-hover:[&>span]:w-4'

export const buttonDefaultClassName =
  'inline-flex items-center justify-center font-sans font-bold uppercase tracking-wider border-2 border-primary bg-primary text-primary-foreground px-6 py-3 text-sm transition-all duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-8 sm:py-4'

export const buttonOutlineClassName =
  'inline-flex items-center justify-center font-sans font-bold uppercase tracking-wider border-2 border-primary bg-transparent text-primary px-6 py-3 text-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-8 sm:py-4'
