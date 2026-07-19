import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowRight, Flame, Search, Sparkles } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { HomeNewsletterCta } from '@/components/reader/HomeNewsletterCta'
import { absoluteReaderImageUrl } from '@/lib/readerImageSrc'
import { config } from '@/lib/config'
import { buildHomeSections } from '@/lib/homeSections'
import { buildEditorialHomeModel, articlesFromHomeBlocks } from '@/lib/editorialHomeModel'
import type { Article } from '@/lib/api/types'
import { articleDateLine, mediaCreditLine } from '@/lib/articleDisplayMeta'

export const revalidate = 30

const SITE_URL = config.siteUrl

export const metadata: Metadata = {
  title: 'Scoop Afrique - Lis ton Afrique autrement',
  description:
    "Scoop Afrique simplifie la lecture des sujets panafricains avec des parcours clairs, rapides et engageants.",
  openGraph: {
    title: 'Scoop Afrique - Lis ton Afrique autrement',
    description: 'Articles, analyses et recits africains dans une experience de lecture moderne.',
    url: SITE_URL,
    siteName: 'Scoop Afrique',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scoop Afrique - Lis ton Afrique autrement',
  },
  alternates: { canonical: SITE_URL },
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Aujourd'hui"
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

function readingTime(article: Article) {
  const explicit = (article as Article & { reading_time_min?: number }).reading_time_min
  if (typeof explicit === 'number' && explicit > 0) return explicit
  return 5
}

function articleHref(article: Article) {
  return `/articles/${article.slug}`
}

function articleImage(article: Article) {
  return absoluteReaderImageUrl(article.cover_image_url)
}

function uniqueCategories(articles: Article[]) {
  const seen = new Set<string>()
  const categories: { name: string; href: string }[] = []

  for (const article of articles) {
    const category = article.category
    if (!category || seen.has(category.slug)) continue
    seen.add(category.slug)
    categories.push({ name: category.name, href: `/category/${category.slug}` })
    if (categories.length >= 7) break
  }

  return categories
}

function SearchDock({ categories }: { categories: { name: string; href: string }[] }) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 pb-8 pt-6 sm:px-8 lg:px-10">
      <form action="/search" className="group relative">
        <label htmlFor="home-search" className="sr-only">
          Rechercher un article
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
        <input
          id="home-search"
          name="q"
          type="search"
          placeholder="Cherche un pays, une ville, un artiste, une crise..."
          className="h-14 w-full rounded-full border border-border bg-card pl-12 pr-5 font-sans text-sm text-foreground shadow-[var(--shadow-lg)] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </form>

      <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Acces rapide">
        <Link href="/articles" className="shrink-0 rounded-full bg-foreground px-4 py-2 font-sans text-xs font-black uppercase tracking-[0.08em] text-background">
          Tous
        </Link>
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 font-sans text-xs font-black uppercase tracking-[0.08em] text-muted-foreground hover:border-primary hover:text-primary"
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </section>
  )
}

function HeroRead({ article, nextArticle }: { article: Article; nextArticle?: Article }) {
  const image = articleImage(article)
  const dateLine = articleDateLine(article)
  const creditLine = mediaCreditLine(article)

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,var(--foreground)_1px,transparent_1px),linear-gradient(var(--foreground)_1px,transparent_1px)] [background-size:28px_28px]" aria-hidden />
      <div className="relative mx-auto grid min-h-[580px] max-w-[1460px] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:px-10 lg:py-12">
        <div className="flex flex-col justify-center">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.16em] text-background">
              <Flame className="h-3.5 w-3.5" aria-hidden />
              A lancer
            </span>
            <span className="rounded-full bg-card px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.16em] text-foreground">
              {article.category?.name ?? 'Scoop'}
            </span>
          </div>

          <h1
            className="max-w-3xl text-[clamp(2.6rem,6vw,6.6rem)] font-black leading-[0.88] text-foreground"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="mt-6 line-clamp-2 max-w-xl text-base leading-7 text-muted-foreground sm:line-clamp-none sm:text-lg">
              {article.excerpt}
            </p>
          ) : null}

          {dateLine ? (
            <p className="mt-4 max-w-xl font-sans text-xs font-semibold leading-5 text-muted-foreground">
              {dateLine}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={articleHref(article)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 font-sans text-xs font-black uppercase tracking-[0.12em] text-background transition hover:bg-primary"
            >
              <span className="sm:hidden">Lire</span>
              <span className="hidden sm:inline">Lire maintenant</span>
            </Link>
            <Link
              href="/articles"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-card px-5 font-sans text-xs font-black uppercase tracking-[0.12em] text-foreground transition hover:text-primary"
            >
              <span className="sm:hidden">Plus</span>
              <span className="hidden sm:inline">Explorer</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {nextArticle ? (
            <Link href={articleHref(nextArticle)} className="mt-10 hidden max-w-md rounded-2xl border border-border bg-card/75 p-4 transition hover:bg-card sm:block">
              <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-primary">Ensuite</p>
              <p className="mt-2 line-clamp-2 text-sm font-black leading-snug text-foreground">{nextArticle.title}</p>
            </Link>
          ) : null}
        </div>

        <Link href={articleHref(article)} className="group relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[2rem] bg-foreground shadow-[var(--shadow-xl)] sm:aspect-[16/11] lg:min-h-0 lg:aspect-[4/5]">
          {image ? (
            <Image
              src={image}
              alt={`Illustration - ${article.title}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover object-center transition duration-700 group-hover:scale-[1.035]"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--foreground),var(--primary))]" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 via-foreground/45 to-transparent p-5 sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-sans text-xs font-bold text-background/75">
                  {formatDate(article.published_at)} / {readingTime(article)} min
                </p>
                <p className="mt-2 max-w-sm font-sans text-sm font-black uppercase tracking-[0.1em] text-background">
                  Ouvre et continue ton fil
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:bg-card group-hover:text-foreground">
                <ArrowRight className="h-5 w-5" aria-hidden />
              </span>
            </div>
            {creditLine ? (
              <p className="mt-3 max-w-full truncate font-sans text-[10px] font-semibold text-background/58">
                {creditLine}
              </p>
            ) : null}
          </div>
        </Link>
      </div>
    </section>
  )
}

function RailHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
      <h2 className="font-sans text-sm font-black uppercase tracking-[0.14em] text-foreground">{title}</h2>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-2 font-sans text-xs font-black uppercase tracking-[0.1em] text-primary">
          Tout voir <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  )
}

function ArticlePoster({ article, priority = false }: { article: Article; priority?: boolean }) {
  const image = articleImage(article)

  return (
    <article className="group w-[78vw] shrink-0 sm:w-[360px]">
      <Link href={articleHref(article)} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-foreground">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 78vw, 360px"
              className="object-cover transition duration-500 group-hover:scale-[1.05]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/10 to-transparent" />
          <div className="absolute left-4 top-4 rounded-full bg-card px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.12em] text-foreground">
            {article.category?.name ?? 'Story'}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="font-sans text-xs font-bold text-background/70">
              {formatDate(article.published_at ?? article.updated_at)} / {readingTime(article)} min
            </p>
            <h3
              className="mt-2 line-clamp-3 text-2xl font-black leading-[1.02] text-background"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {article.title}
            </h3>
          </div>
        </div>
      </Link>
    </article>
  )
}

function StoryRail({ title, href, articles }: { title: string; href?: string; articles: Article[] }) {
  if (!articles.length) return null
  const shouldAnimate = articles.length > 2
  const railItems = shouldAnimate ? [...articles, ...articles] : articles

  return (
    <section className="py-8">
      <RailHeader title={title} href={href} />
      <div className="overflow-hidden px-5 pb-3 sm:px-8 lg:px-10">
        <div
          className={
            shouldAnimate
              ? 'reader-story-rail flex w-max gap-4'
              : 'flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          }
        >
          {railItems.map((article, index) => (
            <div key={`${article.id}-${index}`}>
              <ArticlePoster article={article} priority={index < 2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function QueueList({ articles }: { articles: Article[] }) {
  if (!articles.length) return null

  return (
    <section className="mx-auto grid max-w-[1460px] gap-4 px-5 py-8 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-10">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 font-sans text-[10px] font-black uppercase tracking-[0.14em] text-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Fil de lecture
        </p>
        <h2
          className="mt-4 max-w-md text-4xl font-black leading-none text-foreground sm:text-5xl"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Lis les sujets sans te perdre.
        </h2>
      </div>

      <div className="divide-y divide-border rounded-[1.5rem] border border-border bg-card">
        {articles.slice(0, 6).map((article, index) => (
          <Link
            key={article.id}
            href={articleHref(article)}
            className="grid gap-4 p-4 transition hover:bg-muted/45 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
          >
            <span className="font-sans text-2xl font-black text-muted-foreground/45">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                {article.category?.name ?? 'Scoop'}
              </span>
              <span className="mt-1 block text-lg font-black leading-snug text-foreground">{article.title}</span>
            </span>
            <span className="font-sans text-xs font-bold text-muted-foreground">
              {formatDate(article.published_at ?? article.updated_at)} / {readingTime(article)} min
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  const { blocks, articles } = await buildHomeSections()
  const model = buildEditorialHomeModel(blocks, articles)
  const allArticles = articlesFromHomeBlocks(blocks, articles)
  const categories = uniqueCategories(allArticles)

  const jsonLdList = [model.hero, ...model.lead, ...model.selection, ...model.videos, ...model.briefs]
    .filter((article): article is Article => Boolean(article))
    .slice(0, 12)

  const itemListJsonLd = jsonLdList.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Scoop Afrique - Parcours de lecture',
        numberOfItems: jsonLdList.length,
        itemListElement: jsonLdList.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_URL}/articles/${article.slug}`,
          name: article.title,
        })),
      }
    : null

  return (
    <ReaderLayout>
      {itemListJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      ) : null}

      <main className="bg-background text-foreground">
        {model.hero ? <HeroRead article={model.hero} nextArticle={model.lead[0]} /> : null}
        <SearchDock categories={categories} />

        <div className="mx-auto max-w-[1460px]">
          <StoryRail title="Continue avec ca" href="/articles" articles={model.lead} />
          <StoryRail title="Selection qui accroche" href="/articles" articles={model.selection} />
          <QueueList articles={[...model.briefs, ...model.categoryStrip]} />
          <StoryRail title="A regarder ou ecouter" href="/video" articles={model.videos.length ? model.videos : model.categoryStrip.slice(0, 4)} />
          <div className="px-5 sm:px-8 lg:px-10">
            <HomeNewsletterCta />
          </div>
        </div>
      </main>
    </ReaderLayout>
  )
}
