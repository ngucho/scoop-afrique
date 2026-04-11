import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Heading, Button, SectionHeader, Breadcrumb, MotionEnter, Text } from 'scoop'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { FeaturedHero } from '@/components/reader/FeaturedHero'
import { AdSlotSection } from '@/components/reader/AdSlotSection'
import { apiGet } from '@/lib/api/client'
import { config } from '@/lib/config'
import type { Article, ArticlesResponse, Category } from '@/lib/api/types'
import { fetchAdPlacements, pickCreativeForSlot, AD_SLOT_KEYS } from '@/lib/readerAds'

export const revalidate = 60
export const dynamicParams = true

const LIMIT = 13
const SITE_URL = config.siteUrl.replace(/\/$/, '')

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Catégorie introuvable' }
  const title = `${category.name} — Rubrique | Scoop.Afrique`
  const description =
    category.description?.trim() ||
    `Articles, analyses et décryptages ${category.name.toLowerCase()} — Scoop Afrique.`
  const url = `${SITE_URL}/category/${encodeURIComponent(slug)}`
  return {
    title,
    description,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Scoop.Afrique',
      type: 'website',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: { canonical: url },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const [{ data: articles, total }, placements] = await Promise.all([
    getArticlesByCategory(slug),
    fetchAdPlacements(),
  ])
  const catTop = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.CAT_TOP)

  const featured = articles[0]
  const rest = articles.slice(1)
  const url = `${SITE_URL}/category/${encodeURIComponent(slug)}`

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description ?? undefined,
    url,
    isPartOf: { '@type': 'WebSite', name: 'Scoop.Afrique', url: SITE_URL },
    numberOfItems: total,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.slice(0, 12).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/articles/${a.slug}`,
        name: a.title,
      })),
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Articles', item: `${SITE_URL}/articles` },
      { '@type': 'ListItem', position: 3, name: category.name, item: url },
    ],
  }

  return (
    <ReaderLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          className="mb-6"
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Articles', href: '/articles' },
            { label: category.name },
          ]}
        />

        <header className="mb-10">
          <SectionHeader label="Rubrique" className="mb-4" />
          <Heading as="h1" level="h1" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {category.name}
          </Heading>
          <Text variant="muted" className="mt-3 max-w-2xl">
            {category.description?.trim() ||
              `Hub éditorial : les derniers articles classés dans « ${category.name} ».`}
          </Text>
        </header>

        {catTop ? (
          <MotionEnter as="div" className="mb-10 flex justify-center">
            <AdSlotSection slotKey={AD_SLOT_KEYS.CAT_TOP} creative={catTop.creative} className="w-full max-w-3xl" />
          </MotionEnter>
        ) : null}

        {featured ? (
          <MotionEnter as="section" className="mb-12">
            <SectionHeader label="À la une dans cette rubrique" className="mb-6" />
            <FeaturedHero article={featured} />
          </MotionEnter>
        ) : null}

        <section>
          <SectionHeader label="Dans cette rubrique" className="mb-6" />
          {rest.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((article: Article) => (
                <MotionEnter key={article.id} className="scoop-motion-hover-depth rounded-xl">
                  <ArticleCard article={article} variant="row" />
                </MotionEnter>
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
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href={`/articles?category=${encodeURIComponent(slug)}`}>Voir plus d&apos;articles</Link>
            </Button>
            <Text variant="muted" className="text-sm">
              {total} articles au total dans cette rubrique.
            </Text>
          </div>
        ) : null}
      </div>
    </ReaderLayout>
  )
}
