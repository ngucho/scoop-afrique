'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface MediaFeatureCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Zone média (iframe, poster, icône, …). */
  media: React.ReactNode
  heading: React.ReactNode
  description?: React.ReactNode
  layout?: 'stack' | 'horizontal'
}

/**
 * Carte mise en avant média (vidéo, podcast) — bordures et surfaces sémantiques.
 */
export function MediaFeatureCard({
  media,
  heading,
  description,
  layout = 'stack',
  className,
  ...props
}: MediaFeatureCardProps) {
  const horizontal = layout === 'horizontal'
  return (
    <article
      className={cn(
        'group overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-muted/40',
        horizontal ? 'flex flex-col sm:flex-row' : 'relative',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'overflow-hidden bg-muted/50',
          horizontal ? 'flex aspect-square w-full shrink-0 items-center justify-center sm:w-48' : 'aspect-video w-full'
        )}
      >
        {media}
      </div>
      <div className={cn('flex flex-1 flex-col justify-center', horizontal ? 'p-5' : 'p-5')}>
        {heading}
        {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
      </div>
    </article>
  )
}
