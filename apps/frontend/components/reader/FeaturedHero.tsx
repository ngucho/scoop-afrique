import Link from 'next/link'
import Image from 'next/image'
import type { Article } from '@/lib/api/types'
import { absoluteReaderImageUrl } from '@/lib/readerImageSrc'

interface FeaturedHeroProps {
  article: Article
  /** high = image LCP (à la une) ; low = héros secondaire sous la ligne de flottaison */
  imageFetchPriority?: 'high' | 'low'
}

/**
 * À la une — plein cadre photo, texte ancré haut-droite, vignettes + ombres pour la lisibilité (sans panneau opaque).
 */
export function FeaturedHero({ article, imageFetchPriority = 'high' }: FeaturedHeroProps) {
  const href = `/articles/${article.slug}`
  const label = article.category?.name ?? 'À la une'
  const coverSrc = absoluteReaderImageUrl(article.cover_image_url)
  const lcp = imageFetchPriority === 'high'
  const byline =
    (article as { author_display_name?: string | null }).author_display_name ??
    article.author?.email?.split('@')[0] ??
    'Rédaction'

  return (
    <section className="mb-12 w-full min-w-0 max-w-full">
      <Link
        href={href}
        className="group relative block max-w-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.05] transition-[box-shadow,transform] duration-500 ease-out hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.35)] dark:shadow-[0_24px_56px_-20px_rgba(0,0,0,0.55)] dark:ring-white/[0.08] dark:hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.65)]"
      >
        <div className="relative isolate min-h-[min(78vh,680px)] w-full md:min-h-[480px] lg:min-h-[520px]">
          {/* Visuel plein cadre */}
          <div className="absolute inset-0">
            {coverSrc ? (
              <Image
                src={coverSrc}
                alt={`Illustration — ${article.title}`}
                fill
                sizes="100vw"
                priority={lcp}
                quality={88}
                className="object-cover object-center transition-transform duration-[1.1s] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04]"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-muted to-muted/60" />
            )}

            {/* Vignettes légères (pas de panneau opaque) : texte blanc ombré reste lisible */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-black/35 via-black/10 to-transparent dark:from-black/50 dark:via-black/15 dark:to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/30 from-[-5%] via-transparent via-45% to-transparent dark:from-black/45 dark:via-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent dark:from-black/50"
              aria-hidden
            />
          </div>

          {/* Texte : ancré haut-droite */}
          <div className="relative z-10 flex min-h-[min(78vh,680px)] flex-col items-stretch p-4 sm:p-6 md:min-h-[480px] md:items-end md:p-8 lg:min-h-[520px] lg:p-10">
            <div className="w-full max-w-[min(100%,36rem)] border-r-4 border-primary p-5 text-left sm:pr-7 sm:pl-2 md:mr-0 md:ml-auto md:border-r-[6px] md:pr-8 md:text-right">
              <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.24em] text-primary drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] md:ml-auto">
                {label}
              </span>

              <h2
                className="mb-4 text-balance text-2xl font-bold leading-[1.12] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.95)] sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.08]"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {article.title}
              </h2>

              {article.excerpt ? (
                <p className="mb-6 text-pretty text-base leading-relaxed text-white/95 drop-shadow-[0_1px_10px_rgba(0,0,0,0.88)] sm:text-lg md:ml-0 md:max-w-none">
                  {article.excerpt}
                </p>
              ) : null}

              <div className="flex flex-col gap-5 border-t border-white/25 pt-5 md:items-end">
                <div className="text-left md:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                    {byline}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                    Grande une
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition group-hover:bg-primary/92 group-active:scale-[0.98] md:self-end">
                  Lire l&apos;article
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
