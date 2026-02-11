'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface ThumbnailProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto'
}

const aspectRatioMap = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  auto: '',
} as const

const Thumbnail = React.forwardRef<HTMLDivElement, ThumbnailProps>(
  ({ className, src, alt, aspectRatio = 'video', ...imgProps }, ref) => {
    const ratioClass = aspectRatioMap[aspectRatio]
    return (
      <div
        ref={ref}
        className={cn('relative inline-block overflow-hidden bg-muted', ratioClass, className)}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover object-center"
          {...imgProps}
        />
      </div>
    )
  }
)
Thumbnail.displayName = 'Thumbnail'

export { Thumbnail }
