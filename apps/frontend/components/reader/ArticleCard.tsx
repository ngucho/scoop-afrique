import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { MetaBar } from 'scoop'
import type { Article } from '@/lib/api/types'
import { ReaderCoverImage } from '@/components/reader/ReaderCoverImage'
import { absoluteReaderImageUrl } from '@/lib/readerImageSrc'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'compact' | 'row'
  emphasizeVideo?: boolean
  imagePriority?: boolean
}

export function ArticleCard({
  article,
  variant = 'default',
  emphasizeVideo,
  imagePriority = false,
}: ArticleCardProps) {
  const href = `/articles/${article.slug}`
  const cat = article.category?.name

  /* ── Variante ROW — image gauche, texte droite ── */
  if (variant === 'row') {
    const rowSrc = absoluteReaderImageUrl(article.cover_image_url)
    return (
      <article className="group flex min-w-0 max-w-full flex-col gap-4 md:flex-row">
        <Link
          href={href}
          className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-muted md:w-[42%] md:max-w-[42%]"
          tabIndex={-1}
          aria-hidden
        >
          {rowSrc ? (
            <Image
              src={rowSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
              loading={imagePriority ? 'eager' : 'lazy'}
              priority={imagePriority}
              quality={80}
            />
          ) : null}
        </Link>
        <div className="min-w-0 flex-1">
          {cat ? (
            <span className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {cat}
            </span>
          ) : null}
          <Link href={href}>
            <h3
              className="mb-2 line-clamp-3 text-lg font-bold leading-snug text-foreground transition-colors duration-150 group-hover:text-primary sm:text-xl"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {article.title}
            </h3>
          </Link>
          {article.excerpt ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          ) : null}
          <MetaBar className="mt-3" dateTime={article.published_at ?? undefined} />
        </div>
      </article>
    )
  }

  /* ── Variante COMPACT — carte portrait ── */
  if (variant === 'compact') {
    const showPlay = emphasizeVideo && !!article.video_url
    return (
      <Link href={href} className="group block cursor-pointer">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-primary/25 hover:shadow-[var(--shadow-md)]">
          <div className="relative overflow-hidden">
            {article.cover_image_url ? (
              <ReaderCoverImage
                src={article.cover_image_url}
                alt={`Illustration — ${article.title}`}
                aspectClassName="aspect-video"
                className="w-full rounded-none"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 320px"
                priority={imagePriority}
                imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="aspect-video w-full bg-muted" />
            )}

            {/* Catégorie pill sur l'image */}
            {cat ? (
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                {cat}
              </span>
            ) : null}

            {showPlay ? (
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
                  <Play className="h-5 w-5 fill-current pl-0.5" strokeWidth={0} />
                </span>
              </span>
            ) : null}
          </div>

          <div className="p-4">
            <h3
              className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-foreground"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {article.title}
            </h3>
            <MetaBar dateTime={article.published_at ?? undefined} />
          </div>
        </div>
      </Link>
    )
  }

  /* ── Variante DEFAULT — carte portrait large ── */
  return (
    <Link href={href} className="group block cursor-pointer">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-primary/25 hover:shadow-[var(--shadow-md)]">
        <div className="relative overflow-hidden">
          {article.cover_image_url ? (
            <ReaderCoverImage
              src={article.cover_image_url}
              alt={`Illustration — ${article.title}`}
              aspectClassName="aspect-video"
              className="w-full rounded-none"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              priority={imagePriority}
              imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="aspect-video w-full bg-muted" />
          )}

          {/* Catégorie pill */}
          {cat ? (
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              {cat}
            </span>
          ) : null}
        </div>

        <div className="p-4">
          <h3
            className="mb-2 line-clamp-2 text-base font-bold leading-snug text-foreground sm:text-lg"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {article.title}
          </h3>
          {article.excerpt ? (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          ) : null}
          <MetaBar dateTime={article.published_at ?? undefined} />
        </div>
      </div>
    </Link>
  )
}
