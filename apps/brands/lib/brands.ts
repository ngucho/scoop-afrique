/**
 * SSR-safe class names for brands pages (no client-only scoop variants).
 * Keeps design consistent with scoop link/button variants.
 */
export const backLinkClassName =
  'group inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary [&>span]:h-px [&>span]:w-0 [&>span]:bg-primary [&>span]:transition-all [&>span]:duration-300 group-hover:[&>span]:w-4'

export const buttonDefaultClassName =
  'inline-flex items-center justify-center min-h-[44px] rounded-full font-sans font-bold uppercase tracking-wider border-2 border-primary bg-[length:100%_100%] bg-[var(--gradient-primary)] text-primary-foreground px-8 py-3.5 text-sm transition-all duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-10 sm:py-4'

export const buttonOutlineClassName =
  'inline-flex items-center justify-center min-h-[44px] rounded-full font-sans font-bold uppercase tracking-wider border-2 border-primary bg-transparent text-primary px-8 py-3.5 text-sm transition-all duration-300 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-10 sm:py-4'
