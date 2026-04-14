import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Card, CardContent, Heading, Text, MetaBar } from 'scoop'
import type { Article } from '@/lib/api/types'
import { ReaderCoverImage } from '@/components/reader/ReaderCoverImage'
import { absoluteReaderImageUrl } from '@/lib/readerImageSrc'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'compact' | 'row'
  /** Sur la variante compacte : pastille lecture si l’article a une vidéo */
  emphasizeVideo?: boolean
  /** true = au-dessus de la ligne de flottaison (fetchPriority élevé, pas de lazy) */
  imagePriority?: boolean
}

export function ArticleCard({ article, variant = 'default', emphasizeVideo, imagePriority = false }: ArticleCardProps) {
  const href = `/articles/${article.slug}`

  if (variant === 'row') {
    const cat = article.category?.name
    const rowSrc = absoluteReaderImageUrl(article.cover_image_url)
    return (
      <article className="group flex min-w-0 max-w-full flex-col gap-4 md:flex-row">
        <Link
          href={href}
          className="relative block aspect-[16/10] w-full max-w-full shrink-0 overflow-hidden rounded-lg bg-muted md:w-[42%] md:max-w-[42%]"
        >
          {rowSrc ? (
            <Image
              src={rowSrc}
              alt={`Illustration — ${article.title}`}
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading={imagePriority ? 'eager' : 'lazy'}
              priority={imagePriority}
              quality={80}
            />
          ) : null}
        </Link>
        <div className="min-w-0 flex-1">
          {cat ? (
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-primary">{cat}</span>
          ) : null}
          <Link href={href}>
                       <h3
              className="mb-2 line-clamp-3 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {article.title}
            </h3>
          </Link>
          {article.excerpt ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
          ) : null}
        </div>
      </article>
    )
  }

  if (variant === 'compact') {
    const showPlay = emphasizeVideo && !!article.video_url
    return (
      <Link href={href} className="group block hover-lift">
        <Card variant="news" className="overflow-hidden transition-shadow">
          <div className="relative">
            {article.cover_image_url ? (
              <ReaderCoverImage
                src={article.cover_image_url}
                alt={`Illustration — ${article.title}`}
                aspectClassName="aspect-video"
                className="w-full rounded-none"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 320px"
                priority={imagePriority}
                imgClassName="transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="aspect-video w-full bg-muted" />
            )}
            {showPlay ? (
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white shadow-lg">
                  <Play className="h-6 w-6 fill-current pl-0.5" strokeWidth={0} />
                </span>
              </span>
            ) : null}
          </div>
          <CardContent className="p-4">
            <Heading as="h3" level="h5" className="mb-1 line-clamp-2">
              {article.title}
            </Heading>
            <MetaBar dateTime={article.published_at ?? undefined} />
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={href} className="group block hover-lift">
      <Card variant="news" className="overflow-hidden transition-shadow">
        {article.cover_image_url ? (
          <ReaderCoverImage
            src={article.cover_image_url}
            alt={`Illustration — ${article.title}`}
            aspectClassName="aspect-video"
            className="w-full rounded-none"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            priority={imagePriority}
            imgClassName="transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-video w-full bg-muted" />
        )}
        <CardContent className="p-4">
          <Heading as="h3" level="h4" className="mb-2 line-clamp-2">
            {article.title}
          </Heading>
          {article.excerpt ? (
            <Text variant="muted" className="mb-2 line-clamp-2">
              {article.excerpt}
            </Text>
          ) : null}
          <MetaBar dateTime={article.published_at ?? undefined} />
        </CardContent>
      </Card>
    </Link>
  )
}
