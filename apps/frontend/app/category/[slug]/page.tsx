import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading, Button, SectionHeader } from 'scoop'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { FeaturedHero } from '@/components/reader/FeaturedHero'
import { apiGet } from '@/lib/api/client'
import type { ArticlesResponse, Category } from '@/lib/api/types'

export const revalidate = 60
export const dynamicParams = true

const LIMIT = 13

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const res = await apiGet<{ data: Category }>(`/categories/${encodeURIComponent(slug)}`, {
      revalidate: 600,
    })
    return res.data ?? null
  } catch {
    return null
  }
}

async function getArticlesByCategory(
  slug: string
): Promise<{ data: ArticlesResponse['data']; total: number }> {
  try {
    const res = await apiGet<ArticlesResponse>(
      `/articles?category=${encodeURIComponent(slug)}&limit=${LIMIT}&page=1`,
      { revalidate: 60 }
    )
    return { data: res.data ?? [], total: res.total ?? 0 }
  } catch {
    return { data: [], total: 0 }
  }
}

export async function generateStaticParams() {
  try {
    const res = await apiGet<{ data: Category[] }>('/categories', { revalidate: 600 })
    const categories = res.data ?? []
    return categories.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const { data: articles, total } = await getArticlesByCategory(slug)
  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <ReaderLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
        <header className="mb-10">
          <SectionHeader label="Catégorie" className="mb-4" />
          <Heading as="h1" level="h1" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {category.name}
          </Heading>
          <p className="mt-2 text-muted-foreground">
            Les articles de la rédaction dans la catégorie {category.name}.
          </p>
        </header>

        {featured ? (
          <section className="mb-12">
            <FeaturedHero article={featured} />
          </section>
        ) : null}

        <section>
          <SectionHeader label="Articles" className="mb-6" />
          {rest.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((article) => (
                <ArticleCard key={article.id} article={article} variant="row" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/30 px-6 py-16 text-center sm:px-12">
              <Heading as="h2" level="h3" className="mb-2">
                Aucun article
              </Heading>
              <p className="mb-6 text-muted-foreground">
                Aucun article dans cette catégorie pour le moment.
              </p>
              <Button asChild>
                <Link href="/articles">Voir tous les articles</Link>
              </Button>
            </div>
          ) : null}
        </section>

        {total > LIMIT ? (
          <div className="mt-12 flex justify-center">
            <Button asChild>
              <Link href={`/articles?category=${slug}`}>Voir plus d&apos;articles</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </ReaderLayout>
  )
}
