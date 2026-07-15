import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
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

interface PageProps {
  searchParams: Promise<{ category?: string; page?: string; q?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { category, page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const qTrim = q?.trim() ?? ''
  const categoryLabel =
    category && category !== 'all'
      ? READER_CATEGORIES.find((c) => c.slug === category)?.label ?? category.replace(/-/g, ' ')
      : null

  return {
    title: qTrim
      ? `Recherche ${qTrim} - Articles`
      : categoryLabel
        ? `${categoryLabel} - Articles`
        : 'Articles - Scoop Afrique',
    description: qTrim
      ? `Articles correspondant a ${qTrim} sur Scoop Afrique.`
      : 'Explorez les articles Scoop Afrique dans un parcours simple et mobile-first.',
    robots: qTrim ? { index: false, follow: true } : { index: true, follow: true },
    alternates: {
      canonical: `${SITE_URL}/articles${page > 1 ? `?page=${page}` : ''}`,
    },
  }
}

async function getArticles(
  category?: string,
  page = 1,
  q?: string,
  limit = LIMIT
): Promise<{ data: ArticlesResponse['data']; total: number }> {
  try {
    const params = new URLSearchParams({ limit: String(limit), page: String(page) })
    if (category && category !== 'all') params.set('category', category)
    if (q?.trim()) params.set('q', q.trim())
    const res = await apiGet<ArticlesResponse>(`/articles?${params}`, { revalidate: 30 })
    return { data: res.data ?? [], total: res.total ?? 0 }
  } catch {
    return { data: [], total: 0 }
  }
}

function categoryHref(slug?: string, q?: string) {
  const params = new URLSearchParams()
  if (slug && slug !== 'all') params.set('category', slug)
  if (q?.trim()) params.set('q', q.trim())
  const qs = params.toString()
  return `/articles${qs ? `?${qs}` : ''}`
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const { category, page: pageParam, q } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const qTrim = q?.trim() ?? ''
  const queryLimit = qTrim ? page * LIMIT : LIMIT
  const queryPage = qTrim ? 1 : page
  const [{ data: articles, total }, placements] = await Promise.all([
    getArticles(category, queryPage, qTrim, queryLimit),
    fetchAdPlacements(),
  ])
  const totalPages = Math.ceil(total / LIMIT)
  const listTop = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.LIST_TOP)
  const activeCategory =
    category && category !== 'all'
      ? READER_CATEGORIES.find((c) => c.slug === category)?.label ?? category.replace(/-/g, ' ')
      : null

  return (
    <ReaderLayout>
      <main className="bg-background text-foreground">
        <section className="mx-auto max-w-[1460px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                Bibliotheque
              </p>
              <h1
                className="mt-3 max-w-2xl text-5xl font-black leading-[0.9] sm:text-7xl"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {qTrim ? 'Resultats.' : activeCategory ? `${activeCategory}.` : 'Choisis ton prochain article.'}
              </h1>
            </div>
            <form action="/articles" className="relative">
              {category && category !== 'all' ? <input type="hidden" name="category" value={category} /> : null}
              <label htmlFor="articles-search" className="sr-only">
                Rechercher dans les articles
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="articles-search"
                name="q"
                type="search"
                defaultValue={qTrim}
                placeholder="Pays, sujet, personnalité, crise..."
                className="h-14 w-full rounded-full border border-border bg-card pl-12 pr-5 font-sans text-sm text-foreground shadow-[var(--shadow-lg)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </form>
          </div>

          <nav className="mt-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filtrer par categorie">
            <Link
              href={categoryHref('all', qTrim)}
              className={`shrink-0 rounded-full px-4 py-2 font-sans text-xs font-black uppercase tracking-[0.08em] ${
                !activeCategory ? 'bg-foreground text-background' : 'border border-border bg-card text-muted-foreground'
              }`}
            >
              Tous
            </Link>
            {READER_CATEGORIES.map((item) => (
              <Link
                key={item.slug}
                href={categoryHref(item.slug, qTrim)}
                className={`shrink-0 rounded-full px-4 py-2 font-sans text-xs font-black uppercase tracking-[0.08em] ${
                  category === item.slug ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </section>

        <section className="mx-auto max-w-[1460px] px-5 pb-12 sm:px-8 lg:px-10">
          {listTop ? (
            <div className="mb-8 flex justify-center">
              <AdSlotSection slotKey={AD_SLOT_KEYS.LIST_TOP} creative={listTop.creative} className="w-full max-w-3xl" />
            </div>
          ) : null}

          {articles.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="font-sans text-xs font-bold text-muted-foreground">
                  {qTrim
                    ? `${Math.min(page * LIMIT, total).toLocaleString('fr-FR')} meilleur${Math.min(page * LIMIT, total) > 1 ? 's' : ''} resultat${Math.min(page * LIMIT, total) > 1 ? 's' : ''} sur ${total.toLocaleString('fr-FR')}`
                    : `${total.toLocaleString('fr-FR')} article${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}`}
                </p>
                {qTrim ? (
                  <Link href="/articles" className="font-sans text-xs font-black uppercase tracking-[0.1em] text-primary">
                    Effacer
                  </Link>
                ) : null}
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {articles.map((article: Article, index: number) => (
                  <ArticleCard key={article.id} article={article} imagePriority={index < 4} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination">
                  {page > 1 ? (
                    <Link
                      href={`/articles?page=${page - 1}${category ? `&category=${category}` : ''}${qTrim ? `&q=${encodeURIComponent(qTrim)}` : ''}`}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-card px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Avant
                    </Link>
                  ) : null}
                  {!qTrim ? (
                    <span className="rounded-full border border-border bg-card px-4 py-3 font-sans text-xs font-bold text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                  ) : null}
                  {page < totalPages ? (
                    <Link
                      href={`/articles?page=${page + 1}${category ? `&category=${category}` : ''}${qTrim ? `&q=${encodeURIComponent(qTrim)}` : ''}`}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-background"
                    >
                      {qTrim ? 'Charger plus' : 'Suite'}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-border bg-card p-8 text-center sm:p-12">
              <h2 className="text-3xl font-black" style={{ fontFamily: 'var(--font-headline)' }}>
                Rien trouve.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Essaie un autre mot-cle ou reviens a tous les articles pour relancer ton fil.
              </p>
              <Link
                href="/articles"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-background"
              >
                Tous les articles
              </Link>
            </div>
          )}
        </section>
      </main>
    </ReaderLayout>
  )
}
