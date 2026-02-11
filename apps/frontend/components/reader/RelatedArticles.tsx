import Link from 'next/link'
import { Heading } from 'scoop'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { apiGet } from '@/lib/api/client'
import type { Article, ArticlesResponse } from '@/lib/api/types'

async function getRelatedArticles(excludeSlug: string, limit = 6): Promise<Article[]> {
  try {
    const res = await apiGet<ArticlesResponse>(`/articles?limit=${limit + 5}&page=1`)
    const list = res.data ?? []
    return list.filter((a) => a.slug !== excludeSlug).slice(0, limit)
  } catch {
    return []
  }
}

interface RelatedArticlesProps {
  excludeSlug: string
  className?: string
}

export async function RelatedArticles({ excludeSlug, className }: RelatedArticlesProps) {
  const articles = await getRelatedArticles(excludeSlug)
  if (articles.length === 0) return null

  return (
    <section className={className}>
      <Heading as="h2" level="h2" className="mb-6">
        À voir aussi
      </Heading>
      <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
        {articles.map((article) => (
          <div key={article.id} className="min-w-[280px] md:min-w-0">
            <ArticleCard article={article} variant="compact" />
          </div>
        ))}
      </div>
    </section>
  )
}
