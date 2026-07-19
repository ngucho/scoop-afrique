import Link from 'next/link'
import Image from 'next/image'
import type { Article } from '@/lib/api/types'
import { articleDateLine, mediaCreditLine } from '@/lib/articleDisplayMeta'
import { absoluteReaderImageUrl } from '@/lib/readerImageSrc'

interface FeaturedHeroProps {
  article: Article
  imageFetchPriority?: 'high' | 'low'
}

export function FeaturedHero({ article, imageFetchPriority = 'high' }: FeaturedHeroProps) {
  const href = `/articles/${article.slug}`
  const label = article.category?.name ?? 'A la une'
  const coverSrc = absoluteReaderImageUrl(article.cover_image_url)
  const dateLine = articleDateLine(article)
  const creditLine = mediaCreditLine(article)
  const lcp = imageFetchPriority === 'high'
  const byline =
    (article as { author_display_name?: string | null }).author_display_name ??
    article.author?.email?.split('@')[0] ??
    'Redaction'

  return (
    <section className="mb-10 w-full min-w-0 max-w-full md:mb-12">
      <Link
        href={href}
        className="group relative block w-full overflow-hidden rounded-2xl bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative min-h-[min(72vh,620px)] w-full md:min-h-[480px] lg:min-h-[540px]">
          <div className="absolute inset-0">
            {coverSrc ? (
              <Image
                src={coverSrc}
                alt={`Illustration - ${article.title}`}
                fill
                sizes="100vw"
                priority={lcp}
                quality={88}
                className="object-cover object-center transition-transform duration-[1.2s] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.03]"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-muted to-muted/60" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" aria-hidden />
            {creditLine ? (
              <p className="absolute bottom-3 right-3 z-20 max-w-[calc(100%-1.5rem)] rounded-full bg-black/48 px-3 py-1.5 font-sans text-[10px] font-semibold leading-4 text-white/72 backdrop-blur-md sm:max-w-sm">
                {creditLine}
              </p>
            ) : null}
          </div>

          <div className="relative z-10 flex min-h-[min(72vh,620px)] flex-col justify-end p-5 sm:p-7 md:min-h-[480px] md:p-10 lg:min-h-[540px] lg:p-12">
            <div className="max-w-[min(100%,42rem)]">
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
                  {label}
                </span>
              </div>

              <h2
                className="mb-4 text-balance text-[clamp(1.6rem,4vw,2.8rem)] font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {article.title}
              </h2>

              {article.excerpt ? (
                <p className="mb-6 line-clamp-2 text-pretty text-sm leading-relaxed text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)] sm:text-base sm:leading-relaxed">
                  {article.excerpt}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/80 ring-1 ring-white/30" aria-hidden />
                  <div>
                    <p className="font-sans text-xs font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                      {byline}
                    </p>
                    {dateLine ? (
                      <p className="font-sans text-[10px] leading-4 text-white/65">
                        {dateLine}
                      </p>
                    ) : null}
                  </div>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-foreground shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-active:scale-[0.97]">
                  Lire
                  <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">-&gt;</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
