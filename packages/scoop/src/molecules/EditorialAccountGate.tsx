'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Heading } from '../atoms/Heading'
import { Text } from '../atoms/Text'

export interface EditorialAccountGateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  /** Boutons ou liens d’action (ex. Button asChild + &lt;a&gt;). */
  actions: React.ReactNode
  footer?: React.ReactNode
  /** Hauteur minimale type “écran lecteur”. */
  minHeightClassName?: string
}

/**
 * Écran centré connexion / inscription — tokens thème uniquement.
 */
export function EditorialAccountGate({
  title,
  description,
  actions,
  footer,
  minHeightClassName = 'min-h-[calc(100dvh-8rem)]',
  className,
  ...props
}: EditorialAccountGateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-lg flex-col justify-center px-4 py-16 sm:px-6',
        minHeightClassName,
        className
      )}
      {...props}
    >
      <Heading as="h1" level="h1" className="text-center text-3xl font-bold tracking-tight">
        {title}
      </Heading>
      <Text variant="muted" className="mt-4 text-center">
        {description}
      </Text>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">{actions}</div>
      {footer ? <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  )
}
