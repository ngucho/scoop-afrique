import Link from 'next/link'
import { Heading, Button, SectionHeader, CategoryChips } from 'scoop'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { READER_CATEGORIES } from '@/lib/readerCategories'
import { apiGet } from '@/lib/api/client'
import type { ArticlesResponse } from '@/lib/api/types'

export const revalidate = 30

const LIMIT = 12

const CATEGORY_CHIP_ITEMS = [
  { id: 'all', label: 'Tous', href: '/articles' },
  ...READER_CATEGORIES.map((c) => ({
    id: c.slug,
    label: c.label,
    href: `/articles?category=${c.slug}`,
  })),
]

interface PageProps {
  searchParams: Promise<{ category?: string; page?: string; q?: string }>
}

async function getArticles(
  category?: string,
  page = 1,
  q?: string
): Promise<{ data: ArticlesResponse['data']; total: number }> {
  try {
    const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) })
    if (category && category !== 'all') params.set('category', category)
    if (q?.trim()) params.set('q', q.trim())
    const res = await apiGet<ArticlesResponse>(`/articles?${params}`, { revalidate: 30 })
    return { data: res.data ?? [], total: res.total ?? 0 }
  } catch {
    return { data: [], total: 0 }
  }
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const { category, page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const { data: articles, total } = await getArticles(category, page, q)
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <ReaderLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
        <header className="mb-8">
          <SectionHeader label="Articles" className="mb-4" />
          <Heading as="h1" level="h1" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Toute l&apos;actualité
          </Heading>
          <p className="mt-2 text-muted-foreground">
            Parcourez les articles par catégorie.
          </p>
        </header>

        <nav className="mb-8" aria-label="Filtrer par catégorie">
          <CategoryChips
            items={CATEGORY_CHIP_ITEMS}
            activeId={category && category !== 'all' ? category : 'all'}
          />
        </nav>

        {articles.length > 0 ? (
          <>
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, i) => (
                <div key={article.id} className="animate-fade-in-up" style={{ animationDelay: `${0.04 * i}s` }}>
                  <ArticleCard article={article} />
                </div>
              ))}
            </section>

            {totalPages > 1 && (
              <nav
                className="mt-12 flex flex-wrap items-center justify-center gap-3"
                aria-label="Pagination"
              >
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/articles?page=${page - 1}${category ? `&category=${category}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    >
                      ← Précédent
                    </Link>
                  </Button>
                )}
                <span className="px-4 text-sm text-muted-foreground" aria-current="page">
                  Page {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/articles?page=${page + 1}${category ? `&category=${category}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    >
                      Suivant →
                    </Link>
                  </Button>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-border bg-muted/30 px-6 py-16 text-center sm:px-12">
            <Heading as="h2" level="h3" className="mb-2">
              Aucun article
            </Heading>
            <p className="mb-6 text-muted-foreground">
              Aucun article dans cette catégorie pour le moment.
            </p>
            <Button asChild>
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        )}
      </div>
    </ReaderLayout>
  )
}
