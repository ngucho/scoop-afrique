import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
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
    return (res.data ?? []).map((c) => ({ slug: c.slug }))
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
  if (!category) return { title: 'Categorie introuvable' }
  const title = `${category.name} - Scoop Afrique`
  const description =
    category.description?.trim() ||
    `Articles et lectures Scoop Afrique dans la rubrique ${category.name}.`
  const url = `${SITE_URL}/category/${encodeURIComponent(slug)}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Scoop Afrique', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
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
    isPartOf: { '@type': 'WebSite', name: 'Scoop Afrique', url: SITE_URL },
    numberOfItems: total,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.slice(0, 12).map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/articles/${article.slug}`,
        name: article.title,
      })),
    },
  }

  return (
    <ReaderLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <main className="bg-background text-foreground">
        <section className="mx-auto max-w-[1460px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <Link href="/articles" className="font-sans text-xs font-black uppercase tracking-[0.12em] text-primary">
            Articles
          </Link>
          <div className="mt-5 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em] text-primary">Rubrique</p>
              <h1
                className="mt-3 text-6xl font-black leading-[0.88] sm:text-8xl"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {category.name}
              </h1>
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {category.description?.trim() ||
                `Un fil simple pour lire les derniers sujets ${category.name}, sans te perdre dans trop de blocs.`}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1460px] px-5 pb-12 sm:px-8 lg:px-10">
          {catTop ? (
            <div className="mb-8 flex justify-center">
              <AdSlotSection slotKey={AD_SLOT_KEYS.CAT_TOP} creative={catTop.creative} className="w-full max-w-3xl" />
            </div>
          ) : null}

          {featured ? (
            <div className="mb-10 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
              <div className="rounded-[1.5rem] bg-foreground p-5 text-background sm:p-7">
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-primary">A lancer</p>
                <h2
                  className="mt-4 text-4xl font-black leading-none sm:text-5xl"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  Commence par ce sujet.
                </h2>
                <p className="mt-4 text-sm leading-6 text-background/64">
                  Puis continue avec la file de lecture de cette rubrique.
                </p>
                <Link
                  href={`/articles/${featured.slug}`}
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-background"
                >
                  Lire maintenant <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <ArticleCard article={featured} imagePriority />
            </div>
          ) : null}

          {rest.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-sans text-sm font-black uppercase tracking-[0.14em]">Dans le fil</h2>
                <Link href={`/articles?category=${encodeURIComponent(slug)}`} className="font-sans text-xs font-black uppercase tracking-[0.1em] text-primary">
                  Tout voir
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((article: Article, index: number) => (
                  <ArticleCard key={article.id} article={article} variant={index < 2 ? 'default' : 'row'} imagePriority={index < 2} />
                ))}
              </div>
            </>
          ) : articles.length === 0 ? (
            <div className="rounded-[1.5rem] border border-border bg-card p-8 text-center sm:p-12">
              <h2 className="text-3xl font-black" style={{ fontFamily: 'var(--font-headline)' }}>
                Rien pour le moment.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Cette rubrique n&apos;a pas encore d&apos;article publie.
              </p>
              <Link
                href="/articles"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-background"
              >
                Voir tous les articles
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </ReaderLayout>
  )
}
