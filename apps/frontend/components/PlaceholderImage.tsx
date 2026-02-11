'use client'

import Image from 'next/image'
import { useState } from 'react'

interface PlaceholderImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  fallback?: React.ReactNode
}

export function PlaceholderImage({ src, alt, fill = true, className, sizes, fallback }: PlaceholderImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed && fallback) {
    return fill ? (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">{fallback}</div>
    ) : (
      <>{fallback}</>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  )
}
