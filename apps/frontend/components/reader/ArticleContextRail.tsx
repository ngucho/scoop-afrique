import Link from 'next/link'
import { Heading, Text } from 'scoop'
import type { Article } from '@/lib/api/types'
import { formatDate } from '@/lib/formatDate'

export function ArticleContextRail({
  title,
  articles,
}: {
  title: string
  articles: Article[]
}) {
  if (articles.length === 0) return null
  return (
    <div className="space-y-4">
      <Heading as="h2" level="h4" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </Heading>
      <ul className="space-y-3">
        {articles.map((a) => (
          <li key={a.id}>
            <Link
              href={`/articles/${a.slug}`}
              className="group block rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/40"
            >
              <span className="line-clamp-3 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
                {a.title}
              </span>
              {a.published_at ? (
                <span className="mt-1 block text-xs text-muted-foreground">{formatDate(a.published_at)}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <Text variant="muted" className="text-xs leading-relaxed">
        À lire sur scoop-afrique.com — contenu complet protégé contre la republication automatisée.
      </Text>
    </div>
  )
}
