import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Heading, Button, SectionHeader, CategoryChips, MotionEnter } from 'scoop'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { AdSlotSection } from '@/components/reader/AdSlotSection'
import { READER_CATEGORIES } from '@/lib/readerCategories'
import { apiGet } from '@/lib/api/client'
import { config } from '@/lib/config'
import type { Article, ArticlesResponse } from '@/lib/api/types'
import { fetchAdPlacements, pickCreativeForSlot, AD_SLOT_KEYS } from '@/lib/readerAds'

export const revalidate = 30

const LIMIT = 12
const SITE_URL = config.siteUrl.replace(/\/$/, '')

const DEFAULT_DESCRIPTION =
  "Parcourez tous les articles de Scoop Afrique : actualités, politique, culture, sport, société. Le média qui décrypte l'Afrique autrement."

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { category, page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const qTrim = q?.trim() ?? ''

  if (qTrim) {
    const shortQ = qTrim.length > 60 ? `${qTrim.slice(0, 57)}…` : qTrim
    return {
      title: `Recherche « ${shortQ} » — Articles`,
      description: `Résultats pour « ${shortQ} » sur Scoop.Afrique — articles et analyses.`,
      robots: { index: false, follow: true },
      alternates: { canonical: `${SITE_URL}/articles` },
      openGraph: {
        title: `Recherche — Scoop.Afrique`,
        description: `Articles correspondant à votre recherche.`,
        url: `${SITE_URL}/articles`,
        siteName: 'Scoop.Afrique',
        type: 'website',
      },
      twitter: { card: 'summary_large_image', title: `Recherche — Scoop.Afrique` },
    }
  }

  const catSlug = category && category !== 'all' ? category : undefined
  const catLabel = catSlug
    ? READER_CATEGORIES.find((c) => c.slug === catSlug)?.label ??
      catSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : undefined
  const pageSuffix = page > 1 ? ` — page ${page}` : ''
  const title = catLabel
    ? `${catLabel} — Articles${pageSuffix}`
    : `Tous les articles — Actualités panafricaines${pageSuffix}`

  const description = catLabel
    ? `Articles ${catLabel.toLowerCase()} : analyses et actualités panafricaines sur Scoop.Afrique.`
    : DEFAULT_DESCRIPTION

  /** Page 1 d’une rubrique : URL préférée = hub /category/{slug} (évite le doublon articles?category=). */
  const canonical =
    catSlug && page === 1
      ? `${SITE_URL}/category/${encodeURIComponent(catSlug)}`
      : (() => {
          const canonicalParams = new URLSearchParams()
          if (catSlug) canonicalParams.set('category', catSlug)
          if (page > 1) canonicalParams.set('page', String(page))
          const qs = canonicalParams.toString()
          return `${SITE_URL}/articles${qs ? `?${qs}` : ''}`
        })()

  return {
    title,
    description,
    openGraph: {
      title: catLabel ? `${catLabel} — Articles | Scoop.Afrique` : `Articles | Scoop.Afrique${pageSuffix}`,
      description,
      url: canonical,
      siteName: 'Scoop.Afrique',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: catLabel ? `${catLabel} | Scoop.Afrique` : 'Articles | Scoop.Afrique' },
    alternates: { canonical },
  }
}

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
  const [{ data: articles, total }, placements] = await Promise.all([
    getArticles(category, page, q),
    fetchAdPlacements(),
  ])
  const totalPages = Math.ceil(total / LIMIT)
  const listTop = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.LIST_TOP)
  const listMid = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.LIST_MID)
  const qTrim = q?.trim() ?? ''
  const activeCategoryLabel =
    category && category !== 'all'
      ? READER_CATEGORIES.find((c) => c.slug === category)?.label ??
        category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : null

  return (
    <ReaderLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
        <header className="mb-8">
          <SectionHeader label="Articles" className="mb-4" />
          <Heading as="h1" level="h1" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {qTrim ? (
              <>
                Résultats pour « <span className="text-primary">{qTrim}</span> »
              </>
            ) : (
              <>Toute l&apos;actualité</>
            )}
          </Heading>
          <p className="mt-2 text-muted-foreground">
            {qTrim
              ? 'Affinez votre recherche depuis la page Recherche ou explorez les catégories ci-dessous.'
              : activeCategoryLabel
                ? `Rubrique ${activeCategoryLabel} — parcourez aussi les autres thématiques.`
                : 'Parcourez les articles par catégorie ou utilisez la recherche.'}
          </p>
        </header>

        <nav className="mb-8" aria-label="Filtrer par catégorie">
          <CategoryChips
            items={CATEGORY_CHIP_ITEMS}
            activeId={category && category !== 'all' ? category : 'all'}
          />
        </nav>

        {listTop ? (
          <MotionEnter as="div" className="mb-8 flex justify-center">
            <AdSlotSection slotKey={AD_SLOT_KEYS.LIST_TOP} creative={listTop.creative} className="w-full max-w-3xl" />
          </MotionEnter>
        ) : null}

        {articles.length > 0 ? (
          <>
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.flatMap((article: Article, i: number) => {
                const nodes: ReactNode[] = []
                if (i === 3 && listMid) {
                  nodes.push(
                    <div
                      key="ad-list-mid"
                      className="col-span-full flex justify-center py-2"
                    >
                      <AdSlotSection
                        slotKey={AD_SLOT_KEYS.LIST_MID}
                        creative={listMid.creative}
                        className="w-full max-w-[300px]"
                      />
                    </div>
                  )
                }
                nodes.push(
                  <div key={article.id} className="animate-fade-in-up" style={{ animationDelay: `${0.04 * i}s` }}>
                    <ArticleCard article={article} imagePriority={i < 3} />
                  </div>
                )
                return nodes
              })}
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
              Aucun résultat
            </Heading>
            <p className="mb-6 text-muted-foreground">
              {qTrim
                ? `Aucun article ne correspond à « ${qTrim} ». Essayez d’autres mots-clés ou consultez les rubriques.`
                : activeCategoryLabel
                  ? `Aucun article dans la rubrique « ${activeCategoryLabel} » pour le moment.`
                  : 'Aucun article à afficher pour le moment.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/search">Nouvelle recherche</Link>
              </Button>
              <Button asChild>
                <Link href="/">Accueil</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </ReaderLayout>
  )
}
