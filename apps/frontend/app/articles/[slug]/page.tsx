import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ShareButtons } from '@/components/reader/ShareButtons'
import { LikeButton } from '@/components/reader/LikeButton'
import { CategoryTags } from '@/components/reader/CategoryTags'
import { RelatedArticles } from '@/components/reader/RelatedArticles'
import { ArticleContentBlocks } from '@/components/reader/ArticleContentBlocks'
import { AdSlotSection } from '@/components/reader/AdSlotSection'
import { ArticleContextRail } from '@/components/reader/ArticleContextRail'
import { ArticleCommentsSection } from '@/components/reader/ArticleCommentsSection'
import { ArticleAuthorCard } from '@/components/reader/ArticleAuthorCard'
import { ReaderCoverImage } from '@/components/reader/ReaderCoverImage'
import { apiGet } from '@/lib/api/client'
import type { ArticleResponse, LikesResponse } from '@/lib/api/types'
import { config } from '@/lib/config'
import { toYoutubeEmbedUrl } from '@/lib/youtube'
import { fetchAdPlacements, pickCreativeForSlot, AD_SLOT_KEYS } from '@/lib/readerAds'
import { fetchAnnouncements, inlineAnnouncements } from '@/lib/readerAnnouncements'
import { getContextSidebarArticles } from '@/lib/articleContext'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getArticle(slug: string) {
  try {
    const res = await apiGet<ArticleResponse>(`/articles/${slug}`, { revalidate: 60 })
    return res.data
  } catch {
    return null
  }
}

async function getLikes(articleId: string) {
  try {
    const res = await apiGet<LikesResponse>(`/articles/${articleId}/likes`)
    return res.data
  } catch {
    return { count: 0, liked: false }
  }
}

function absoluteImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http')) return url
  return `${config.siteUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

function readingTime(article: Record<string, unknown>) {
  const value = article.reading_time_min
  return typeof value === 'number' && value > 0 ? `${value} min` : '5 min'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: 'Article introuvable' }

  const title = article.meta_title ?? article.title
  const description = article.meta_description ?? article.excerpt ?? undefined
  const url = `${config.siteUrl}/articles/${article.slug}`
  const ogImage = absoluteImage(article.og_image_url ?? article.cover_image_url) ?? `${config.siteUrl}/opengraph-image`

  return {
    title,
    description,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    other: {
      ...(article.category?.name ? { 'article:section': article.category.name } : {}),
      'news_keywords': [...(article.tags ?? []), article.category?.name, 'Afrique', 'Scoop Afrique'].filter(Boolean).join(', '),
      'original-source': url,
      'syndication-source': url,
      'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Scoop Afrique',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: 'fr_FR',
      type: 'article',
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at ?? undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    alternates: { canonical: url },
  }
}

function ArticleJsonLd({ article, shareUrl }: { article: NonNullable<ArticleResponse['data']>; shareUrl: string }) {
  const image = absoluteImage(article.og_image_url ?? article.cover_image_url)
  const authorName = article.author_display_name ?? article.author?.email ?? 'Scoop Afrique'
  const siteOrigin = config.siteUrl.replace(/\/$/, '')
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt ?? undefined,
    url: shareUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': shareUrl },
    image: image ? [{ '@type': 'ImageObject', url: image, width: 1200, height: 630 }] : undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at,
    articleSection: article.category?.name ?? undefined,
    keywords: [...(article.tags ?? []), article.category?.name, 'Scoop Afrique'].filter(Boolean).join(', '),
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'Scoop Afrique',
      url: siteOrigin,
      logo: { '@type': 'ImageObject', url: `${siteOrigin}/brand-logo.svg`, width: 600, height: 60 },
    },
    isAccessibleForFree: true,
    inLanguage: 'fr-FR',
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  const [likes, placements, announcements, contextArticles] = await Promise.all([
    getLikes(article.id),
    fetchAdPlacements(),
    fetchAnnouncements(),
    getContextSidebarArticles(article.slug, article.category?.slug ?? null, 4),
  ])

  const shareUrl = `${config.siteUrl}/articles/${article.slug}`
  const topAd = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.ARTICLE_TOP)
  const midAd = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.ARTICLE_MID)
  const bottomAd = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.ARTICLE_BOTTOM)
  const railAd = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.ARTICLE_RAIL)
  const relatedBelow = pickCreativeForSlot(placements.slots, placements.creatives_by_slot, AD_SLOT_KEYS.RELATED_BELOW)
  const inlineAnnouncement = inlineAnnouncements(announcements)[0]

  const coverImageUrl = article.cover_image_url
  const videoUrl = (article as unknown as Record<string, unknown>).video_url as string | null | undefined
  const videoEmbedUrl = videoUrl ? toYoutubeEmbedUrl(videoUrl) : null
  const showCoverVideo = !coverImageUrl && !!videoEmbedUrl
  const showVideoAfterBody = !!coverImageUrl && !!videoEmbedUrl
  const railTitle = article.category?.name ? `Encore en ${article.category.name}` : 'A lire ensuite'

  return (
    <ReaderLayout>
      <ArticleJsonLd article={article} shareUrl={shareUrl} />
      <main className="bg-background text-foreground">
        <section className="mx-auto max-w-[1460px] px-5 py-7 sm:px-8 lg:px-10 lg:py-12">
          <div className="mb-6 lg:hidden">
            <Link href="/articles" className="mb-6 inline-flex items-center gap-2 font-sans text-xs font-black uppercase tracking-[0.12em] text-primary">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Articles
            </Link>
            <CategoryTags
              categorySlug={article.category?.slug ?? null}
              categoryName={article.category?.name ?? null}
              className="mb-5"
            />
            <h1
              className="max-w-4xl text-5xl font-black leading-[0.9] sm:text-7xl"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {article.title}
            </h1>
            {article.excerpt ? <p className="mt-6 line-clamp-2 max-w-2xl text-base leading-7 text-muted-foreground sm:line-clamp-none sm:text-lg sm:leading-8">{article.excerpt}</p> : null}
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full bg-card px-4 py-2 font-sans font-bold">{readingTime(article as unknown as Record<string, unknown>)} de lecture</span>
              {article.author_display_name ?? article.author?.email ? (
                <span className="rounded-full bg-card px-4 py-2 font-sans font-bold">
                  Par {article.author_display_name ?? article.author?.email}
                </span>
              ) : null}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-foreground shadow-[var(--shadow-xl)] lg:min-h-[420px]">
            {coverImageUrl ? (
              <figure className="lg:absolute lg:inset-0">
                <ReaderCoverImage
                  src={coverImageUrl}
                  alt={`Illustration - ${article.title}`}
                  aspectClassName="aspect-[4/5] sm:aspect-[16/10] lg:h-full lg:aspect-auto"
                  sizes="(max-width: 1024px) 100vw, 1460px"
                  priority
                  fit="cover"
                  imgClassName="object-center"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-foreground/95 via-foreground/62 to-transparent lg:block" />
              </figure>
            ) : showCoverVideo && videoEmbedUrl ? (
              <div className="aspect-video bg-foreground lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
                <iframe
                  src={videoEmbedUrl}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Video de couverture"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] bg-foreground sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full" />
            )}

            <div className="relative z-10 hidden w-1/2 p-8 text-background lg:flex lg:min-h-[420px] lg:flex-col lg:justify-end xl:p-10">
              <Link href="/articles" className="mb-5 inline-flex items-center gap-2 font-sans text-xs font-black uppercase tracking-[0.12em] text-background/80 transition-colors hover:text-background">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Articles
              </Link>
              <CategoryTags
                categorySlug={article.category?.slug ?? null}
                categoryName={article.category?.name ?? null}
                className="mb-5"
                variant="inverse"
              />
              <h1
                className="text-5xl font-black leading-[0.92] xl:text-6xl"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {article.title}
              </h1>
              {article.excerpt ? <p className="mt-5 line-clamp-2 max-w-3xl text-lg leading-8 text-background/82">{article.excerpt}</p> : null}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-background/80">
                <span className="rounded-full bg-background/12 px-4 py-2 font-sans font-bold backdrop-blur-md">{readingTime(article as unknown as Record<string, unknown>)} de lecture</span>
                {article.author_display_name ?? article.author?.email ? (
                  <span className="rounded-full bg-background/12 px-4 py-2 font-sans font-bold backdrop-blur-md">
                    Par {article.author_display_name ?? article.author?.email}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1460px] px-5 pb-14 sm:px-8 lg:px-10">
          {topAd ? (
            <div className="mb-8 flex justify-center">
              <AdSlotSection slotKey={AD_SLOT_KEYS.ARTICLE_TOP} creative={topAd.creative} articleId={article.id} />
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,760px)_minmax(280px,1fr)]">
            <article className="min-w-0 rounded-[1.75rem] bg-card px-5 py-6 shadow-[var(--shadow-lg)] sm:px-8 lg:px-10">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                <ShareButtons
                  url={shareUrl}
                  title={article.title}
                  excerpt={article.excerpt}
                  tags={article.tags}
                  categoryName={article.category?.name ?? null}
                />
                <LikeButton articleId={article.id} initialCount={likes.count} initialLiked={likes.liked} />
              </div>

              <ArticleContentBlocks
                content={article.content}
                articleId={article.id}
                inlineAnnouncement={inlineAnnouncement}
                midCreative={midAd?.creative ?? null}
              />

              {showVideoAfterBody && videoEmbedUrl ? (
                <div className="my-10 aspect-video overflow-hidden rounded-[1.25rem] bg-foreground">
                  <iframe
                    src={videoEmbedUrl}
                    className="h-full w-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Video"
                    loading="lazy"
                  />
                </div>
              ) : null}

              <div className="mt-8 border-t border-border pt-6">
                <ArticleAuthorCard
                  displayName={article.author_display_name ?? article.author?.email?.split('@')[0] ?? 'Redaction'}
                  authorPublic={article.author_public}
                />
              </div>
            </article>

            <aside className="space-y-5 lg:sticky lg:top-36 lg:self-start">
              <div className="rounded-[1.5rem] border border-border bg-card p-5 text-foreground shadow-[var(--shadow-lg)]">
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                  Lecture suivante
                </p>
                <ArticleContextRail title={railTitle} articles={contextArticles} />
                <Link
                  href="/articles"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 font-sans text-xs font-black uppercase tracking-[0.1em] text-background"
                >
                  Explorer <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <AdSlotSection
                slotKey={AD_SLOT_KEYS.ARTICLE_RAIL}
                creative={railAd?.creative ?? null}
                articleId={article.id}
              />
            </aside>
          </div>

          {bottomAd ? (
            <div className="mt-10">
              <AdSlotSection slotKey={AD_SLOT_KEYS.ARTICLE_BOTTOM} creative={bottomAd.creative} articleId={article.id} />
            </div>
          ) : null}

          <div className="mt-10">
            <ArticleCommentsSection articleId={article.id} />
          </div>

          <RelatedArticles excludeSlug={article.slug} className="mt-10" />

          {relatedBelow ? (
            <div className="mt-10">
              <AdSlotSection slotKey={AD_SLOT_KEYS.RELATED_BELOW} creative={relatedBelow.creative} articleId={article.id} />
            </div>
          ) : null}
        </section>
      </main>
    </ReaderLayout>
  )
}
