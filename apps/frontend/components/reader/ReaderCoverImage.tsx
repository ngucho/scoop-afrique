import Image from 'next/image'
import { cn } from 'scoop'
import { absoluteReaderImageUrl } from '@/lib/readerImageSrc'

export function ReaderCoverImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  imgClassName,
  aspectClassName = 'aspect-video',
  fit = 'cover',
}: {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  className?: string
  imgClassName?: string
  aspectClassName?: string
  fit?: 'cover' | 'contain'
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
        className={cn(fit === 'contain' ? 'object-contain object-center' : 'object-cover object-center', imgClassName)}
      />
    </div>
  )
}
