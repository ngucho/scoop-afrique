import Link from 'next/link'
import { Button } from 'scoop'
import type { Article } from '@/lib/api/types'

interface FeaturedHeroProps {
  article: Article
  /** high = image LCP (à la une) ; low = héros secondaire sous la ligne de flottaison */
  imageFetchPriority?: 'high' | 'low'
}

export function FeaturedHero({ article, imageFetchPriority = 'high' }: FeaturedHeroProps) {
  const href = `/articles/${article.slug}`
  const label = article.category?.name ?? 'À la une'

  return (
    <section className="mb-12 w-full min-w-0 max-w-full">
      <div className="group max-w-full cursor-pointer overflow-hidden rounded-xl bg-editorial-surface-low shadow-[var(--shadow-md)] transition-[box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-lg)]">
        <div className="grid min-w-0 gap-0 md:grid-cols-12">
          <div className="relative min-h-[240px] min-w-0 overflow-hidden sm:min-h-[280px] md:col-span-8 md:min-h-[420px] lg:min-h-[520px]">
            {article.cover_image_url ? (
              <img
                src={article.cover_image_url}
                alt={`Illustration — ${article.title}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 66vw"
                decoding="async"
                fetchPriority={imageFetchPriority}
              />
            ) : (
              <div className="h-full min-h-[280px] bg-editorial-surface-container md:min-h-[420px]" />
            )}
          </div>
          <div className="flex min-w-0 flex-col justify-center break-words bg-editorial-surface-lowest p-4 sm:p-6 md:col-span-4 md:p-8">
            <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-primary">{label}</span>
            <h2
              className="mb-4 text-2xl font-bold leading-[1.15] text-editorial-on-surface sm:text-3xl md:text-4xl lg:text-5xl"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {article.title}
            </h2>
            {article.excerpt ? (
              <p className="mb-8 text-base leading-relaxed text-editorial-secondary sm:text-lg">{article.excerpt}</p>
            ) : null}
            <div className="mt-auto flex items-center gap-3">
              <div className="flex min-w-0 flex-col">
                <p className="text-xs font-bold uppercase tracking-wider text-editorial-on-surface">
                  {(article as { author_display_name?: string | null }).author_display_name ?? article.author?.email?.split('@')[0] ?? 'Rédaction'}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-editorial-secondary">Article à la une</p>
              </div>
            </div>
            <div className="mt-6">
              <Button asChild size="lg" className="rounded-full">
                <Link href={href}>Lire l&apos;article</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
