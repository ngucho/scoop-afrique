'use client'

import * as React from 'react'
import { Button, type ButtonProps } from '../atoms/Button'

type LinkLikeProps = {
  href: string
  className?: string
  children?: React.ReactNode
  target?: string
  rel?: string
  prefetch?: boolean
}

export type CtaLinkLinkComponent = React.ComponentType<LinkLikeProps>

export interface CtaLinkProps extends Omit<ButtonProps, 'asChild'> {
  href: string
  Link: CtaLinkLinkComponent
  external?: boolean
}

/**
 * Bouton primaire secondaire — interne (`Link`) ou externe (`<a>`).
 */
export function CtaLink({ href, Link, external, children, ...buttonProps }: CtaLinkProps) {
  const isExternal = external ?? (href.startsWith('http') || href.startsWith('mailto:'))

  if (isExternal) {
    return (
      <Button asChild {...buttonProps}>
        <a
          href={href}
          target={href.startsWith('mailto:') ? undefined : '_blank'}
          rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
        >
          {children}
        </a>
      </Button>
    )
  }

  return (
    <Button asChild {...buttonProps}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}
