import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { Avatar } from 'scoop'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { apiGet } from '@/lib/api/client'
import { config } from '@/lib/config'
import type { Article, ArticlesResponse, PublicAuthorProfile } from '@/lib/api/types'

export const revalidate = 60
export const dynamicParams = true

const LIMIT = 13
const SITE_URL = config.siteUrl.replace(/\/$/, '')

interface PageProps {
  params: Promise<{ id: string }>
}

async function getAuthor(id: string): Promise<PublicAuthorProfile | null> {
  try {
    const res = await apiGet<{ data: PublicAuthorProfile }>(`/articles/authors/${encodeURIComponent(id)}`, {
      revalidate: 120,
    })
    return res.data ?? null
  } catch {
    return null
  }
}

async function getAuthorArticles(id: string): Promise<{ data: ArticlesResponse['data']; total: number }> {
  try {
    const res = await apiGet<ArticlesResponse>(
      `/articles/authors/${encodeURIComponent(id)}/articles?limit=${LIMIT}&page=1`,
      { revalidate: 60 },
    )
    return { data: res.data ?? [], total: res.total ?? 0 }
  } catch {
    return { data: [], total: 0 }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const author = await getAuthor(id)
  if (!author) return { title: 'Auteur introuvable' }
  const title = `${author.display_name} - Scoop Afrique`
  const description = author.bio?.trim() || `Toutes les publications de ${author.display_name} sur Scoop Afrique.`
  const url = `${SITE_URL}/authors/${encodeURIComponent(id)}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Scoop Afrique', type: 'profile' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { id } = await params
  const author = await getAuthor(id)
  if (!author) notFound()

  const { data: articles, total } = await getAuthorArticles(id)
  const featured = articles[0]
  const rest = articles.slice(1)
  const url = `${SITE_URL}/authors/${encodeURIComponent(id)}`

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: author.display_name,
    description: author.bio ?? undefined,
    url,
    mainEntity: {
      '@type': 'Person',
      name: author.display_name,
      image: author.avatar_url ?? undefined,
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div className="flex items-end gap-5">
              <Avatar src={author.avatar_url ?? undefined} alt="" size="lg" fallback={author.display_name.slice(0, 2)} />
              <div>
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.18em] text-primary">Auteur</p>
                <h1
                  className="mt-3 text-5xl font-black leading-[0.9] sm:text-7xl"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {author.display_name}
                </h1>
              </div>
            </div>
            <div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {author.bio?.trim() || `Toutes les publications de ${author.display_name}, classees comme un fil de lecture dedie.`}
              </p>
              <p className="mt-4 font-sans text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                {total} publication{total > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1460px] px-5 pb-12 sm:px-8 lg:px-10">
          {featured ? (
            <div className="mb-10 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
              <div className="rounded-[1.5rem] bg-foreground p-5 text-background sm:p-7">
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-primary">Derniere publication</p>
                <h2
                  className="mt-4 text-4xl font-black leading-none sm:text-5xl"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  Commence par ce sujet.
                </h2>
                <p className="mt-4 text-sm leading-6 text-background/64">
                  Puis continue avec le fil de publications de cet auteur.
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
                <Link href="/articles" className="font-sans text-xs font-black uppercase tracking-[0.1em] text-primary">
                  Tous les articles
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
                Cet auteur n&apos;a pas encore d&apos;article publie.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </ReaderLayout>
  )
}
