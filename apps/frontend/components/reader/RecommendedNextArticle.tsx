import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { Article } from '@/lib/api/types'
import { ReaderCoverImage } from '@/components/reader/ReaderCoverImage'

export function RecommendedNextArticle({
  article,
  className = '',
}: {
  article: Article
  className?: string
}) {
  return (
    <section className={className} aria-labelledby="recommended-next-heading">
      <Link
        href={`/articles/${article.slug}`}
        className="group grid overflow-hidden rounded-[1.5rem] bg-foreground text-background shadow-[var(--shadow-xl)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-xl)] lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="relative min-h-[220px] overflow-hidden bg-background/10">
          {article.cover_image_url ? (
            <ReaderCoverImage
              src={article.cover_image_url}
              alt=""
              aspectClassName="absolute inset-0 h-full"
              className="h-full"
              sizes="(max-width: 1024px) 100vw, 560px"
              imgClassName="transition duration-700 group-hover:scale-[1.04]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-transparent to-transparent lg:bg-gradient-to-r" />
        </div>
        <div className="flex min-h-[260px] flex-col justify-end p-6 sm:p-8">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-background/12 px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.14em] text-background/82">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            A lire ensuite
          </div>
          <h2
            id="recommended-next-heading"
            className="max-w-3xl text-4xl font-black leading-[0.95] sm:text-5xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {article.title}
          </h2>
          {article.excerpt ? (
            <p className="mt-4 line-clamp-2 max-w-2xl text-sm leading-6 text-background/70 sm:text-base sm:leading-7">
              {article.excerpt}
            </p>
          ) : null}
          <span className="mt-7 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-primary-foreground">
            Continuer <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </Link>
    </section>
  )
}
