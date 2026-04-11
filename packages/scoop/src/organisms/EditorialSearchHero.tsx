'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Heading } from '../atoms/Heading'
import { Text } from '../atoms/Text'

export interface EditorialSearchHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string
  title: string
  description?: string
  /** Contenu principal (ex. EditorialSearchForm). */
  children: React.ReactNode
  /** Liens / actions sous le formulaire. */
  footer?: React.ReactNode
}

/**
 * Mise en page plein viewport (zone contenu) pour une page recherche — dégradés sémantiques `primary`.
 */
export function EditorialSearchHero({
  eyebrow = 'Recherche',
  title,
  description,
  children,
  footer,
  className,
  ...props
}: EditorialSearchHeroProps) {
  return (
    <div
      className={cn('relative flex min-h-[calc(100dvh-6rem)] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8', className)}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 60% at 50% -30%, var(--primary) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 80%, oklch(0.55 0.14 25 / 0.12) 0%, transparent 50%)
          `,
        }}
      />
      <div className="relative mx-auto w-full max-w-3xl">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <Heading
          as="h1"
          level="h1"
          className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl"
        >
          {title}
        </Heading>
        {description ? (
          <Text variant="muted" className="mx-auto mt-4 max-w-xl text-center text-base">
            {description}
          </Text>
        ) : null}
        <div className="mt-10">{children}</div>
        {footer ? <div className="mt-12 flex flex-wrap items-center justify-center gap-3">{footer}</div> : null}
      </div>
    </div>
  )
}
