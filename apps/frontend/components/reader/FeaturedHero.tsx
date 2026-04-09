import Link from 'next/link'
import { Button, Heading, Badge, GlassCard } from 'scoop'
import type { Article } from '@/lib/api/types'

interface FeaturedHeroProps {
  article: Article
}

export function FeaturedHero({ article }: FeaturedHeroProps) {
  const href = `/articles/${article.slug}`

  return (
    <section className="grid min-h-[320px] grid-cols-1 overflow-hidden rounded-xl shadow-[var(--shadow-glass-layer-2)] md:min-h-[380px] md:grid-cols-2">
      <div className="relative min-h-[200px] rounded-t-xl md:min-h-full md:rounded-l-xl md:rounded-tr-none">
        {article.cover_image_url ? (
          <img
            src={article.cover_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:from-transparent md:via-transparent md:to-transparent md:bg-gradient-to-r md:from-black/40" />
      </div>
      <GlassCard
        elevation="raised"
        className="flex flex-col justify-center gap-4 rounded-none rounded-b-xl border-x-0 border-t border-b border-[var(--glass-border)] p-6 md:rounded-b-none md:rounded-r-xl md:border md:border-l-0 md:border-[var(--glass-border)] md:p-8 lg:p-10"
      >
        <Badge variant="breaking" className="w-fit">
          À la une
        </Badge>
        <Heading
          as="h2"
          level="h2"
          className="line-clamp-3 text-2xl font-bold text-[var(--on-glass-foreground)] sm:text-3xl"
        >
          {article.title}
        </Heading>
        {article.excerpt ? (
          <p className="line-clamp-2 text-[var(--on-glass-muted)]">{article.excerpt}</p>
        ) : null}
        <div className="pt-2">
          <Button asChild size="lg">
            <Link href={href}>Lire l&apos;article</Link>
          </Button>
        </div>
      </GlassCard>
    </section>
  )
}
