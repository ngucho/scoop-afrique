'use client'

import Link from 'next/link'
import { Button } from 'scoop'

export interface CtaButtonProps {
  href: string
  variant?: 'default' | 'outline' | 'fillHover'
  size?: 'sm' | 'default' | 'lg'
  children: React.ReactNode
  external?: boolean
  className?: string
}

/**
 * Uses scoop Button with Next.js Link for internal navigation.
 * For external/mailto links, uses <a>.
 */
export function CtaButton({
  href,
  variant = 'default',
  size = 'default',
  children,
  external,
  className,
}: CtaButtonProps) {
  const isExternal = external ?? (href.startsWith('http') || href.startsWith('mailto:'))

  if (isExternal) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}>
          {children}
        </a>
      </Button>
    )
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}
