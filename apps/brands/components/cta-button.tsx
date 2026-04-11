'use client'

import Link from 'next/link'
import { CtaLink, type CtaLinkProps } from 'scoop'

export type CtaButtonProps = Omit<CtaLinkProps, 'Link'>

/** Wrapper `CtaLink` (scoop) + Next `Link` — conservé pour les imports `@/components/cta-button`. */
export function CtaButton(props: CtaButtonProps) {
  return <CtaLink Link={Link} {...props} />
}
