import Link from 'next/link'
import type { Metadata } from 'next'
import { Heading, Button, Badge, SectionHeader, MotionEnter, Text } from 'scoop'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { FeaturedHero } from '@/components/reader/FeaturedHero'
import { AdSlotSection } from '@/components/reader/AdSlotSection'
import { HomeNewsletterCta } from '@/components/reader/HomeNewsletterCta'
import { config } from '@/lib/config'
import { buildHomeSections, type HomePageBlock } from '@/lib/homeSections'
import { fetchAdPlacements, pickCreativeForSlot, AD_SLOT_KEYS } from '@/lib/readerAds'
import { fetchAnnouncements, homeSidebarAnnouncements } from '@/lib/readerAnnouncements'
import { fetchTribuneSnapshotContributions } from '@/lib/tribuneSnapshot'
import { HomeLeftRail } from '@/components/reader/HomeLeftRail'
import type { Article } from '@/lib/api/types'
import type { HomepageSection } from '@/lib/api/types'

export const revalidate = 30

const SITE_URL = config.siteUrl

/** Edge-to-edge carousel on mobile; parent must have min-w-0 to avoid horizontal page scroll */
const HOME_CAROUSEL_ROW =
  '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [-webkit-overflow-scrolling:touch] md:mx-0 md:px-0'

export const metadata: Metadata = {
  title: 'Actualités panafricaines — Scoop.Afrique',
  description:
    "Le média digital qui décrypte l'Afrique autrement. Actualités, politique, culture, sport, société. Articles, newsletter, vidéos et podcasts.",
  openGraph: {
    title: 'Scoop.Afrique — Actualités & articles panafricains',
    description: "Le média digital qui décrypte l'Afrique autrement.",
    url: SITE_URL,
    siteName: 'Scoop.Afrique',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scoop.Afrique — Actualités panafricaines',
  },
  alternates: { canonical: SITE_URL },
}

function collectJsonLdArticles(blocks: HomePageBlock[]): Article[] {
  const out: Article[] = []
  const seen = new Set<string>()
  const push = (a: Article) => {
    if (seen.has(a.id)) return
    seen.add(a.id)
    out.push(a)
  }
  for (const b of blocks) {
    if (b.type === 'hero') {
      push(b.article)
      continue
    }
    if (b.type === 'articles') {
      for (const a of b.articles) {
        push(a)
        if (out.length >= 12) return out
      }
      continue
    }
    if (b.type === 'rubriques') {
      for (const strip of b.strips) {
        for (const a of strip.articles) {
          push(a)
          if (out.length >= 12) return out
        }
      }
    }
  }
  return out
}

function hasEditorialHomeContent(blocks: HomePageBlock[]): boolean {
  for (const b of blocks) {
    if (b.type === 'hero') return true
    if (b.type === 'articles' && b.articles.length > 0) return true
    if (b.type === 'rubriques' && b.strips.some((s) => s.articles.length > 0)) return true
  }
  return false
}

function HomeRubriqueStripArticles({
  layout,
  articles,
}: {
  layout: HomepageSection['layout']
  articles: Article[]
}) {
  if (layout === 'carousel') {
    return (
      <div className="min-w-0 w-full max-w-full">
        <div className={HOME_CAROUSEL_ROW}>
        {articles.map((article, i) => (
          <div key={article.id} className="w-[min(272px,calc(100vw-2.5rem))] shrink-0 snap-start sm:w-[min(280px,85vw)] md:w-[260px]">
            <MotionEnter disabled={i > 4}>
              <ArticleCard article={article} variant="compact" imagePriority={i === 0} />
            </MotionEnter>
          </div>
        ))}
        </div>
      </div>
    )
  }

  if (layout === 'featured_grid') {
    return (
      <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article, i) => (
          <MotionEnter key={article.id} className="min-w-0 scoop-motion-hover-depth rounded-xl">
            <ArticleCard article={article} imagePriority={i < 2} />
          </MotionEnter>
        ))}
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-2">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} variant="row" />
      ))}
    </div>
  )
}

function HomeArticlesSection({
  block,
}: {
  block: Extract<HomePageBlock, { type: 'articles' }>
}) {
  const { title, layout, articles, sectionKey } = block
  const carousel = layout === 'carousel'
  const grid = layout === 'featured_grid'

  const header = (
    <div className="mb-6 flex min-w-0 max-w-full flex-wrap items-end justify-between gap-3 gap-y-4 md:mb-8">
      {sectionKey === 'latest' ? (
        <h2
          className="min-w-0 max-w-full break-words border-l-4 border-primary pl-3 text-2xl font-bold text-foreground sm:pl-4 sm:text-3xl"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          {title}
        </h2>
      ) : (
        <div className="min-w-0 max-w-full flex-1 basis-[min(100%,280px)]">
          <SectionHeader label={title} />
        </div>
      )}
      <Link
        href="/articles"
        className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary transition-opacity hover:opacity-80"
      >
        Tout voir <span aria-hidden>→</span>
      </Link>
    </div>
  )

  if (sectionKey === 'trending') {
    if (carousel) {
      return (
        <MotionEnter as="section" className="mb-14 min-w-0 max-w-full md:mb-16">
          {header}
          <div className="min-w-0 w-full max-w-full">
            <div className={HOME_CAROUSEL_ROW}>
            {articles.map((article, i) => (
              <div key={article.id} className="w-[min(272px,calc(100vw-2.5rem))] shrink-0 snap-start sm:w-[min(280px,85vw)] md:w-[260px]">
                <MotionEnter disabled={i > 4}>
                  <ArticleCard article={article} variant="compact" imagePriority={i === 0} />
                </MotionEnter>
              </div>
            ))}
            </div>
          </div>
        </MotionEnter>
      )
    }
    return (
      <MotionEnter as="section" className="mb-14 min-w-0 max-w-full md:mb-16">
        {header}
        <ol className="grid min-w-0 gap-3 sm:grid-cols-2">
          {articles.map((article, i) => (
            <li
              key={article.id}
              className="flex min-w-0 gap-3 rounded-xl border border-border bg-card/50 p-3 sm:gap-4 sm:p-4 scoop-motion-hover-depth"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0">
                <Link href={`/articles/${article.slug}`} className="font-semibold leading-snug hover:text-primary">
                  {article.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{article.view_count?.toLocaleString('fr-FR')} vues</p>
              </div>
            </li>
          ))}
        </ol>
      </MotionEnter>
    )
  }

  if (carousel) {
    const emphasizeVideo = sectionKey === 'video'
    return (
      <MotionEnter as="section" className="mb-14 min-w-0 max-w-full md:mb-16">
        {header}
        <div className="min-w-0 w-full max-w-full">
          <div className={HOME_CAROUSEL_ROW}>
          {articles.map((article, i) => (
            <div key={article.id} className="w-[min(272px,calc(100vw-2.5rem))] shrink-0 snap-start sm:w-[min(280px,85vw)] md:w-[260px]">
              <MotionEnter disabled={i > 4}>
                <ArticleCard
                  article={article}
                  variant="compact"
                  emphasizeVideo={emphasizeVideo}
                  imagePriority={i === 0}
                />
              </MotionEnter>
            </div>
          ))}
          </div>
        </div>
      </MotionEnter>
    )
  }

  if (grid) {
    return (
      <MotionEnter as="section" className="mb-14 min-w-0 max-w-full md:mb-16">
        {header}
        <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((article, i) => (
            <MotionEnter key={article.id} className="min-w-0 scoop-motion-hover-depth rounded-xl">
              <ArticleCard
                article={article}
                variant={sectionKey === 'video' ? 'compact' : 'default'}
                emphasizeVideo={sectionKey === 'video'}
                imagePriority={i < 2}
              />
            </MotionEnter>
          ))}
        </div>
      </MotionEnter>
    )
  }

  /* list */
  return (
    <MotionEnter as="section" className="mb-14 min-w-0 max-w-full md:mb-16">
      {header}
      <div className="grid min-w-0 gap-8 sm:grid-cols-2 sm:gap-10">
        {articles.map((article, i) => (
          <MotionEnter key={article.id} disabled={i > 5}>
            <ArticleCard
              article={article}
              variant="row"
              emphasizeVideo={sectionKey === 'video'}
              imagePriority={i < 2}
            />
          </MotionEnter>
        ))}
      </div>
    </MotionEnter>
  )
}

export default async function HomePage() {
  const [{ blocks }, placements, tribuneSnapshot, allAnnouncements] = await Promise.all([
    buildHomeSections(),
    fetchAdPlacements(),
    fetchTribuneSnapshotContributions(5),
    fetchAnnouncements(),
  ])
  const sidebarAnnouncements = homeSidebarAnnouncements(allAnnouncements)
  const { slots, creatives_by_slot } = placements
  const sponsorAd = pickCreativeForSlot(slots, creatives_by_slot, AD_SLOT_KEYS.HOME_HERO_SPONSOR)

  const jsonLdList = collectJsonLdArticles(blocks)
  const hasEditorial = hasEditorialHomeContent(blocks)

  const itemListJsonLd = jsonLdList.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'À la une — Scoop.Afrique',
        numberOfItems: jsonLdList.length,
        itemListElement: jsonLdList.slice(0, 12).map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/articles/${a.slug}`,
          name: a.title,
        })),
      }
    : null

  const videoBlockIndex = blocks.findIndex((b) => b.type === 'articles' && b.sectionKey === 'video')
  const mobileNewsletterAfterIndex = videoBlockIndex >= 0 ? videoBlockIndex : Math.min(1, Math.max(0, blocks.length - 1))

  return (
    <ReaderLayout>
      {itemListJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      ) : null}
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 pb-24 pt-8 sm:px-6 md:pb-12 lg:px-8">
        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:gap-12 lg:items-start">
          <div className="min-w-0 max-w-full lg:col-start-2 lg:row-start-1">
        <header className="mb-10 min-w-0 max-w-full">
          <SectionHeader label="Accueil" className="mb-4" />
          <Heading
            as="h1"
            level="h1"
            className="break-words text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            L&apos;Afrique, en continu
          </Heading>
          <p className="mt-3 max-w-2xl break-words text-muted-foreground">
            Décryptages, reportages et analyses — la page d&apos;accueil suit l&apos;ordre défini dans le CMS (sections,
            encarts pub, mise en page par bloc).
          </p>
        </header>

        {blocks.map((block, i) => (
          <div key={`${block.type}-${block.cmsKey}-${i}`} className="min-w-0 max-w-full">
            {block.type === 'hero' ? (
              <MotionEnter as="section" className="mb-12 min-w-0 max-w-full md:mb-14">
                {sponsorAd ? (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Partenaire</p>
                    <AdSlotSection slotKey={AD_SLOT_KEYS.HOME_HERO_SPONSOR} creative={sponsorAd.creative} label="Sponsor" />
                  </div>
                ) : null}
                <FeaturedHero article={block.article} />
              </MotionEnter>
            ) : null}

            {block.type === 'articles' ? <HomeArticlesSection block={block} /> : null}

            {block.type === 'rubriques' ? (
              <div className="mb-14 min-w-0 max-w-full space-y-14 md:mb-16">
                <MotionEnter as="div">
                  <h2
                    className="mb-8 break-words border-l-4 border-primary pl-3 text-xl font-bold text-foreground sm:pl-4 sm:text-2xl md:text-3xl"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    {block.title}
                  </h2>
                </MotionEnter>
                {block.strips.map((strip) => (
                  <MotionEnter as="section" key={strip.slug} className="min-w-0 max-w-full">
                    <div className="mb-6 flex min-w-0 max-w-full flex-wrap items-end justify-between gap-3 gap-y-4">
                      <div className="min-w-0 max-w-full flex-1 basis-[min(100%,240px)]">
                        <SectionHeader label={strip.label} />
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0" asChild>
                        <Link href={strip.slug === 'actualites' ? '/articles' : `/category/${strip.slug}`}>
                          Voir la rubrique
                        </Link>
                      </Button>
                    </div>
                    <HomeRubriqueStripArticles layout={block.layout} articles={strip.articles} />
                  </MotionEnter>
                ))}
              </div>
            ) : null}

            {block.type === 'inline_ad'
              ? (() => {
                  const picked = pickCreativeForSlot(slots, creatives_by_slot, block.adSlotKey)
                  if (!picked) return null
                  const wide = block.adSlotKey === AD_SLOT_KEYS.HOME_BOTTOM
                  return (
                    <MotionEnter as="div" className="mb-14 flex min-w-0 justify-center" role="complementary" aria-label={block.title}>
                      <AdSlotSection
                        slotKey={block.adSlotKey}
                        creative={picked.creative}
                        className={wide ? 'w-full max-w-full' : 'w-full max-w-[min(100%,300px)]'}
                        label={block.title}
                      />
                    </MotionEnter>
                  )
                })()
              : null}

            {i === mobileNewsletterAfterIndex ? (
              <div className="mb-14 md:hidden">
                <HomeNewsletterCta />
              </div>
            ) : null}
          </div>
        ))}

        <div className="mb-14 hidden md:block">
          <HomeNewsletterCta />
        </div>

        {!hasEditorial ? (
          <div className="rounded-xl border border-border bg-muted/30 px-6 py-16 text-center sm:px-12">
            <Badge className="mb-4" variant="muted">
              À venir
            </Badge>
            <Heading as="h2" level="h3" className="mb-2">
              Aucun article pour le moment
            </Heading>
            <Text variant="muted" className="mx-auto mb-8 max-w-md">
              Les articles seront bientôt disponibles. En attendant, explorez le site vitrine ou inscrivez-vous à la newsletter.
            </Text>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="https://brands.scoop-afrique.com">Visiter brands.scoop-afrique.com</Link>
              </Button>
              <Button asChild>
                <Link href="/newsletter">S&apos;inscrire à la newsletter</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-12 flex justify-center">
            <Button asChild size="lg" className="press-effect">
              <Link href="/articles">Voir tous les articles</Link>
            </Button>
          </div>
        )}
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <HomeLeftRail
              contributions={tribuneSnapshot}
              sidebarAnnouncements={sidebarAnnouncements}
            />
          </div>
        </div>
      </div>
    </ReaderLayout>
  )
}
