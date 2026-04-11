import Link from 'next/link'
import type { Metadata } from 'next'
import { Heading, Button, Badge, SectionHeader, MotionEnter, Text } from 'scoop'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleCard } from '@/components/reader/ArticleCard'
import { FeaturedHero } from '@/components/reader/FeaturedHero'
import { AdSlotSection } from '@/components/reader/AdSlotSection'
import { HomeNewsletterCta } from '@/components/reader/HomeNewsletterCta'
import { config } from '@/lib/config'
import { buildHomeSections } from '@/lib/homeSections'
import { fetchAdPlacements, pickCreativeForSlot, AD_SLOT_KEYS } from '@/lib/readerAds'

export const revalidate = 30

const SITE_URL = config.siteUrl

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

export default async function HomePage() {
  const [{ sections, titles }, placements] = await Promise.all([buildHomeSections(), fetchAdPlacements()])
  const { slots, creatives_by_slot } = placements
  const topAd = pickCreativeForSlot(slots, creatives_by_slot, AD_SLOT_KEYS.GLOBAL_TOP_BANNER)
  const midAd = pickCreativeForSlot(slots, creatives_by_slot, AD_SLOT_KEYS.HOME_MID_1)
  const bottomAd = pickCreativeForSlot(slots, creatives_by_slot, AD_SLOT_KEYS.HOME_BOTTOM)
  const sponsorAd = pickCreativeForSlot(slots, creatives_by_slot, AD_SLOT_KEYS.HOME_HERO_SPONSOR)

  const { featured, latest, videoArticles, trending, editorsPicks, categoryStrips } = sections
  const hasArticles = !!featured || latest.length > 0

  const itemListJsonLd = hasArticles
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'À la une — Scoop.Afrique',
        numberOfItems: [featured, ...latest].filter(Boolean).length,
        itemListElement: [featured, ...latest]
          .filter(Boolean)
          .slice(0, 12)
          .map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/articles/${a!.slug}`,
            name: a!.title,
          })),
      }
    : null

  return (
    <ReaderLayout>
      {itemListJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      ) : null}
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 md:pb-12 lg:px-8">
        {topAd ? (
          <MotionEnter as="div" className="mb-8 flex justify-center">
            <AdSlotSection slotKey={AD_SLOT_KEYS.GLOBAL_TOP_BANNER} creative={topAd.creative} className="w-full max-w-6xl" />
          </MotionEnter>
        ) : null}

        <header className="mb-10">
          <SectionHeader label="Accueil" className="mb-4" />
          <Heading
            as="h1"
            level="h1"
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            L&apos;Afrique, en continu
          </Heading>
          <p className="mt-3 max-w-2xl text-editorial-secondary">
            Décryptages, reportages et analyses — une sélection modulaire mise à jour depuis la rédaction.
          </p>
        </header>

        {featured ? (
          <MotionEnter as="section" className="mb-12">
            {sponsorAd ? (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Partenaire</p>
                <AdSlotSection slotKey={AD_SLOT_KEYS.HOME_HERO_SPONSOR} creative={sponsorAd.creative} label="Sponsor" />
              </div>
            ) : null}
            <FeaturedHero article={featured} />
          </MotionEnter>
        ) : null}

        {latest.length > 0 ? (
          <MotionEnter as="section" className="mb-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2
                className="border-l-4 border-primary pl-4 text-3xl font-bold text-editorial-on-surface"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {titles.latest}
              </h2>
              <Link
                href="/articles"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary transition-opacity hover:opacity-80"
              >
                Tout voir <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid gap-10 sm:grid-cols-2">
              {latest.map((article, i) => (
                <MotionEnter key={article.id} disabled={i > 5}>
                  <ArticleCard article={article} variant="row" />
                </MotionEnter>
              ))}
            </div>
          </MotionEnter>
        ) : null}

        {videoArticles.length > 0 ? (
          <MotionEnter as="section" className="mb-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <SectionHeader label={titles.video} />
              <Link
                href="/articles"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary transition-opacity hover:opacity-80"
              >
                Tout voir <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
              {videoArticles.map((article, i) => (
                <div
                  key={article.id}
                  className="w-[min(280px,85vw)] shrink-0 snap-start md:w-[260px]"
                >
                  <MotionEnter disabled={i > 4}>
                    <ArticleCard article={article} variant="compact" emphasizeVideo />
                  </MotionEnter>
                </div>
              ))}
            </div>
          </MotionEnter>
        ) : null}

        <div className="mb-14 md:hidden">
          <HomeNewsletterCta />
        </div>

        {trending.length > 0 ? (
          <MotionEnter as="section" className="mb-14">
            <SectionHeader label={titles.trending} className="mb-6" />
            <ol className="grid gap-3 sm:grid-cols-2">
              {trending.map((article, i) => (
                <li
                  key={article.id}
                  className="flex gap-4 rounded-xl border border-border bg-card/50 p-4 scoop-motion-hover-depth"
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
        ) : null}

        {editorsPicks.length > 0 ? (
          <MotionEnter as="section" className="mb-14">
            <SectionHeader label={titles.editors} className="mb-6" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {editorsPicks.map((article) => (
                <MotionEnter key={article.id} className="scoop-motion-hover-depth rounded-xl">
                  <ArticleCard article={article} />
                </MotionEnter>
              ))}
            </div>
          </MotionEnter>
        ) : null}

        {midAd ? (
          <MotionEnter as="div" className="mb-14 flex justify-center">
            <AdSlotSection slotKey={AD_SLOT_KEYS.HOME_MID_1} creative={midAd.creative} className="w-full max-w-[320px] lg:max-w-[400px]" />
          </MotionEnter>
        ) : null}

        {categoryStrips.length > 0 ? (
          <div className="space-y-14">
            {categoryStrips.map((strip) => (
              <MotionEnter as="section" key={strip.slug}>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <SectionHeader label={strip.label} />
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={strip.slug === 'actualites' ? '/articles' : `/category/${strip.slug}`}>
                      Voir la rubrique
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {strip.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="row" />
                  ))}
                </div>
              </MotionEnter>
            ))}
          </div>
        ) : null}

        <div className="mb-14 hidden md:block">
          <HomeNewsletterCta />
        </div>

        {bottomAd ? (
          <MotionEnter as="div" className="mb-14 flex justify-center">
            <AdSlotSection slotKey={AD_SLOT_KEYS.HOME_BOTTOM} creative={bottomAd.creative} className="w-full" />
          </MotionEnter>
        ) : null}

        {!hasArticles ? (
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
    </ReaderLayout>
  )
}
