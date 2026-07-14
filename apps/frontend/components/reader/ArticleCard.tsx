import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import { MetaBar } from 'scoop'
import type { Article } from '@/lib/api/types'
import { ReaderCoverImage } from '@/components/reader/ReaderCoverImage'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'compact' | 'row'
  emphasizeVideo?: boolean
  imagePriority?: boolean
}

function categoryLabel(article: Article) {
  return article.category?.name ?? 'Scoop'
}

export function ArticleCard({
  article,
  variant = 'default',
  emphasizeVideo,
  imagePriority = false,
}: ArticleCardProps) {
  const href = `/articles/${article.slug}`
  const showPlay = emphasizeVideo && !!article.video_url

  if (variant === 'row') {
    return (
      <article className="group min-w-0 rounded-[1.25rem] border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-[var(--shadow-lg)]">
        <Link href={href} className="grid gap-4 sm:grid-cols-[168px_1fr] sm:items-center">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem] bg-foreground">
            {article.cover_image_url ? (
              <ReaderCoverImage
                src={article.cover_image_url}
                alt=""
                aspectClassName="absolute inset-0"
                className="h-full"
                sizes="(max-width: 640px) 100vw, 168px"
                priority={imagePriority}
                imgClassName="transition duration-500 group-hover:scale-[1.04]"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.14em] text-primary">
              {categoryLabel(article)}
            </p>
            <h3
              className="mt-2 line-clamp-2 text-xl font-black leading-[1.05] text-foreground group-hover:text-primary"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {article.title}
            </h3>
            {article.excerpt ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
            ) : null}
            <MetaBar className="mt-3 text-muted-foreground" dateTime={article.published_at ?? undefined} />
          </div>
        </Link>
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <Link href={href} className="group block">
        <article className="overflow-hidden rounded-[1.25rem] border border-border bg-card transition hover:border-primary/40">
          <div className="relative aspect-[16/10] overflow-hidden bg-foreground">
            {article.cover_image_url ? (
              <ReaderCoverImage
                src={article.cover_image_url}
                alt=""
                aspectClassName="absolute inset-0"
                className="h-full"
                sizes="(max-width: 768px) 100vw, 320px"
                priority={imagePriority}
                imgClassName="transition duration-500 group-hover:scale-[1.04]"
              />
            ) : null}
            {showPlay ? (
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground">
                  <Play className="h-5 w-5 fill-current pl-0.5" strokeWidth={0} />
                </span>
              </span>
            ) : null}
          </div>
          <div className="p-4">
            <p className="font-sans text-[10px] font-black uppercase tracking-[0.14em] text-primary">
              {categoryLabel(article)}
            </p>
            <h3
              className="mt-2 line-clamp-2 text-base font-black leading-tight text-foreground"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {article.title}
            </h3>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-foreground text-background shadow-[var(--shadow-lg)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-xl)]">
        <div className="relative aspect-[4/5] overflow-hidden">
          {article.cover_image_url ? (
            <ReaderCoverImage
              src={article.cover_image_url}
              alt=""
              aspectClassName="absolute inset-0"
              className="h-full"
              sizes="(max-width: 768px) 100vw, 400px"
              priority={imagePriority}
              imgClassName="transition duration-500 group-hover:scale-[1.04]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/92 via-foreground/20 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-card px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.12em] text-foreground">
            {categoryLabel(article)}
          </span>
        </div>
        <div className="-mt-24 flex min-h-[150px] flex-1 flex-col justify-end p-4">
          <h3
            className="relative line-clamp-3 text-2xl font-black leading-[1.02] text-background"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {article.title}
          </h3>
          <div className="relative mt-4 flex items-center justify-between gap-3">
            <MetaBar className="text-background/64" dateTime={article.published_at ?? undefined} />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:bg-card group-hover:text-foreground">
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
