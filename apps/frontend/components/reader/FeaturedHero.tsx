import Link from 'next/link'
import { Button, Heading, Badge } from 'scoop'
import type { Article } from '@/lib/api/types'

interface FeaturedHeroProps {
  article: Article
}

export function FeaturedHero({ article }: FeaturedHeroProps) {
  const href = `/articles/${article.slug}`

  return (
    <section className="grid min-h-[320px] grid-cols-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg md:min-h-[380px] md:grid-cols-2">
      <div className="relative min-h-[200px] md:min-h-full">
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
      <div className="flex flex-col justify-center gap-4 p-6 md:p-8 lg:p-10">
        <Badge variant="breaking" className="w-fit">
          À la une
        </Badge>
        <Heading as="h2" level="h2" className="line-clamp-3 text-2xl font-bold sm:text-3xl">
          {article.title}
        </Heading>
        {article.excerpt ? (
          <p className="line-clamp-2 text-muted-foreground">{article.excerpt}</p>
        ) : null}
        <div className="pt-2">
          <Button asChild size="lg">
            <Link href={href}>Lire l&apos;article</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
