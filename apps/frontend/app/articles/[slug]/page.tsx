import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ShareButtons } from '@/components/reader/ShareButtons'
import { LikeButton } from '@/components/reader/LikeButton'
import { CategoryTags } from '@/components/reader/CategoryTags'
import { RelatedArticles } from '@/components/reader/RelatedArticles'
import { ArticleContentBlocks } from '@/components/reader/ArticleContentBlocks'
import { AdSlotSection } from '@/components/reader/AdSlotSection'
import { ArticleContextRail } from '@/components/reader/ArticleContextRail'
import { Heading, Text, MetaBar, Thumbnail, StickyRail } from 'scoop'
import { apiGet } from '@/lib/api/client'
import type { ArticleResponse, LikesResponse } from '@/lib/api/types'
import { config } from '@/lib/config'
import { formatDate } from '@/lib/formatDate'
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: 'Article introuvable' }
  const title = article.meta_title ?? article.title
  const description = article.meta_description ?? article.excerpt ?? undefined
  const url = `${config.siteUrl}/articles/${article.slug}`
  const image = article.og_image_url ?? article.cover_image_url ?? undefined
  const imageUrl = image?.startsWith('http')
    ? image
    : image
      ? `${config.siteUrl}${image.startsWith('/') ? '' : '/'}${image}`
      : undefined

  return {
    title,
    description,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Scoop.Afrique',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: title }] : undefined,
      locale: 'fr_FR',
      type: 'article',
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at ?? undefined,
      authors: (article as { author_display_name?: string }).author_display_name
        ? [(article as { author_display_name?: string }).author_display_name!]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    alternates: { canonical: url },
  }
}

function absoluteImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http')) return url
  return `${config.siteUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

function ArticleJsonLd({
  article,
  shareUrl,
}: {
  article: {
    id: string
    title: string
    excerpt: string | null
    slug: string
    published_at: string | null
    updated_at: string
    cover_image_url: string | null
    author_display_name?: string | null
    author?: { email: string | null } | null
  }
  shareUrl: string
}) {
  const image = absoluteImage(article.cover_image_url)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt ?? undefined,
    url: shareUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': shareUrl },
    image: image ? [image] : undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author_display_name ?? article.author?.email ?? 'Scoop Afrique',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Scoop.Afrique',
      url: config.siteUrl,
      logo: { '@type': 'ImageObject', url: `${config.siteUrl}/og-image.png` },
    },
    isAccessibleForFree: true,
    copyrightHolder: { '@type': 'Organization', name: 'Scoop.Afrique' },
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

  const inlineList = inlineAnnouncements(announcements)
  const inlineAnnouncement = inlineList[0]

  const coverImageUrl = (article as unknown as Record<string, unknown>).cover_image_url as
    | string
    | null
    | undefined
  const videoUrl = (article as unknown as Record<string, unknown>).video_url as string | null | undefined
  const videoEmbedUrl = videoUrl ? toYoutubeEmbedUrl(videoUrl) : null
  const hasCoverImage = !!coverImageUrl
  const hasCoverVideo = !hasCoverImage && !!videoEmbedUrl
  const showVideoAtEnd = hasCoverImage && !!videoEmbedUrl

  const railTitle = article.category?.name ? `Autres ${article.category.name}` : 'À lire aussi'

  return (
    <ReaderLayout>
      <ArticleJsonLd article={article} shareUrl={shareUrl} />
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:gap-10 xl:gap-12">
          <article className="min-w-0 max-w-3xl lg:max-w-none">
            <Link
              href="/articles"
              className="mb-6 inline-block text-sm font-medium text-primary transition-colors hover:underline"
            >
              ← Retour aux articles
            </Link>
            <CategoryTags
              categorySlug={article.category?.slug ?? null}
              categoryName={article.category?.name ?? null}
              className="mb-4"
            />

            {topAd ? (
              <div className="mb-6">
                <AdSlotSection slotKey={AD_SLOT_KEYS.ARTICLE_TOP} creative={topAd.creative} articleId={article.id} />
              </div>
            ) : null}

            {hasCoverImage && (
              <div className="mb-8 overflow-hidden rounded-xl">
                <Thumbnail src={coverImageUrl} alt="" aspectRatio="video" className="w-full" />
              </div>
            )}
            {hasCoverVideo && videoEmbedUrl && (
              <div className="mb-8 aspect-video overflow-hidden rounded-xl">
                <iframe
                  src={videoEmbedUrl}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Vidéo de couverture"
                  loading="lazy"
                />
              </div>
            )}

            <header className="mb-6">
              <Heading as="h1" level="h1" className="mt-2">
                {article.title}
              </Heading>
              {article.excerpt ? (
                <Text variant="lead" className="mt-2">
                  {article.excerpt}
                </Text>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <MetaBar
                    dateTime={article.published_at ?? undefined}
                    duration={
                      (article as unknown as Record<string, unknown>).reading_time_min
                        ? `${(article as unknown as Record<string, unknown>).reading_time_min} min de lecture`
                        : undefined
                    }
                  />
                  {((article as { author_display_name?: string | null }).author_display_name ??
                    article.author?.email) && (
                    <span className="text-sm text-muted-foreground">
                      Par{' '}
                      <span className="font-medium text-foreground">
                        {(article as { author_display_name?: string | null }).author_display_name ??
                          article.author?.email ??
                          'Auteur'}
                      </span>
                    </span>
                  )}
                </div>
                <ShareButtons url={shareUrl} title={article.title} />
              </div>
              <p className="sr-only">Publié le {formatDate(article.published_at)}</p>
            </header>

            <ArticleContentBlocks
              content={article.content}
              articleId={article.id}
              inlineAnnouncement={inlineAnnouncement}
              midCreative={midAd?.creative ?? null}
            />

            {showVideoAtEnd && videoEmbedUrl && (
              <div className="mb-10 aspect-video overflow-hidden rounded-xl">
                <iframe
                  src={videoEmbedUrl}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Vidéo"
                  loading="lazy"
                />
              </div>
            )}

            <footer className="border-t border-border pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <ShareButtons url={shareUrl} title={article.title} />
                <LikeButton
                  articleId={article.id}
                  initialCount={likes.count}
                  initialLiked={likes.liked}
                />
              </div>
            </footer>

            {bottomAd ? (
              <div className="mt-10">
                <AdSlotSection slotKey={AD_SLOT_KEYS.ARTICLE_BOTTOM} creative={bottomAd.creative} articleId={article.id} />
              </div>
            ) : null}
          </article>

          <div className="mt-10 hidden lg:mt-0 lg:block">
            <StickyRail offset="6rem" className="space-y-6">
              <ArticleContextRail title={railTitle} articles={contextArticles} />
              {railAd ? (
                <AdSlotSection slotKey={AD_SLOT_KEYS.ARTICLE_RAIL} creative={railAd.creative} articleId={article.id} />
              ) : null}
            </StickyRail>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-6 lg:px-8">
        <RelatedArticles excludeSlug={article.slug} className="mt-8" />
      </div>

      {relatedBelow ? (
        <div className="mx-auto max-w-6xl px-4 pb-12 lg:px-8">
          <AdSlotSection slotKey={AD_SLOT_KEYS.RELATED_BELOW} creative={relatedBelow.creative} articleId={article.id} />
        </div>
      ) : null}
    </ReaderLayout>
  )
}
