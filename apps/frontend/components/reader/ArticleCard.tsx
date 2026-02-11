import Link from 'next/link'
import { Card, CardContent, Heading, Text, Thumbnail, MetaBar } from 'scoop'
import type { Article } from '@/lib/api/types'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'compact' | 'row'
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const href = `/articles/${article.slug}`

  if (variant === 'row') {
    return (
      <Link href={href} className="flex gap-4 hover-lift rounded-lg p-1 transition-all">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded bg-muted">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <Heading as="h3" level="h5" className="line-clamp-2">
            {article.title}
          </Heading>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link href={href} className="block hover-lift">
        <Card variant="news" className="overflow-hidden transition-shadow">
          {article.cover_image_url ? (
            <Thumbnail
              src={article.cover_image_url}
              alt=""
              aspectRatio="video"
              className="w-full"
            />
          ) : (
            <div className="aspect-video w-full bg-muted" />
          )}
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
    <Link href={href} className="block hover-lift">
      <Card variant="news" className="overflow-hidden transition-shadow">
        {article.cover_image_url ? (
          <Thumbnail
            src={article.cover_image_url}
            alt=""
            aspectRatio="video"
            className="w-full"
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
