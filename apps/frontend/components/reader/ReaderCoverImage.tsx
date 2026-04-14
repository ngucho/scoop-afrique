import Image from 'next/image'
import { cn } from 'scoop'
import { absoluteReaderImageUrl } from '@/lib/readerImageSrc'

/**
 * Couverture optimisée (next/image `fill`) — remplit le cadre en `object-cover`.
 */
export function ReaderCoverImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  imgClassName,
  aspectClassName = 'aspect-video',
}: {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  /** Conteneur relatif (ratio + overflow) */
  className?: string
  imgClassName?: string
  aspectClassName?: string
}) {
  const absolute = absoluteReaderImageUrl(src)
  if (!absolute) return null

  return (
    <div className={cn('relative w-full overflow-hidden', aspectClassName, className)}>
      <Image
        src={absolute}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={85}
        className={cn('object-cover object-center', imgClassName)}
      />
    </div>
  )
}
