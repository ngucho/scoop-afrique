import Link from 'next/link'
import { Heading, Button, Badge, SectionHeader } from 'scoop'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { FeaturedHero } from '@/components/reader/FeaturedHero'
import { apiGet } from '@/lib/api/client'
import type { ArticlesResponse } from '@/lib/api/types'

export const revalidate = 30 // ISR: refresh every 30 seconds

async function getHomeArticles(): Promise<ArticlesResponse['data']> {
  try {
    const res = await apiGet<ArticlesResponse>('/articles?limit=13&page=1', { revalidate: 30 })
    return res.data ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const articles = await getHomeArticles()
  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <ReaderLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
        <header className="mb-10 animate-fade-in-up">
          <SectionHeader label="Actualité" className="mb-4" />
          <Heading as="h1" level="h1" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Les articles de la rédac
          </Heading>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Retrouvez toute l&apos;actualité panafricaine : politique, culture, sport, société et plus encore.
          </p>
        </header>

        {featured ? (
          <section className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <FeaturedHero article={featured} />
          </section>
        ) : null}

        <section>
          <SectionHeader label="Tous nos articles" className="mb-6" />
          {rest.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((article, i) => (
                <div key={article.id} className="animate-fade-in-up" style={{ animationDelay: `${0.05 * (i + 1)}s` }}>
                  <ArticleCard article={article} variant="row" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/30 px-6 py-16 text-center sm:px-12">
              <Badge className="mb-4" variant="muted">
                À venir
              </Badge>
              <Heading as="h2" level="h3" className="mb-2">
                Aucun article pour le moment
              </Heading>
              <p className="mx-auto mb-8 max-w-md text-muted-foreground">
                Les articles seront bientôt disponibles. En attendant, explorez le site vitrine ou inscrivez-vous à la newsletter.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button asChild variant="outline">
                  <Link href="https://www.scoop-afrique.com">Visiter scoop-afrique.com</Link>
                </Button>
                <Button asChild>
                  <Link href="/newsletter">S&apos;inscrire à la newsletter</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        {articles.length > 0 ? (
          <div className="mt-12 flex justify-center">
            <Button asChild size="lg">
              <Link href="/articles">Voir tous les articles</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </ReaderLayout>
  )
}
