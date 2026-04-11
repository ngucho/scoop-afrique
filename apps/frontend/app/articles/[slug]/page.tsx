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
import { ArticleCommentsSection } from '@/components/reader/ArticleCommentsSection'
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
  const ogImage = imageUrl ?? `${config.siteUrl}/opengraph-image`

  const section = article.category?.name

  return {
    title,
    description,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    ...(section ? { other: { 'article:section': section } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: 'Scoop.Afrique',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
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
      images: [ogImage],
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
    category?: { name: string; slug: string } | null
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
    ...(article.category?.name ? { articleSection: article.category.name } : {}),
    author: {
      '@type': 'Person',
      name: article.author_display_name ?? article.author?.email ?? 'Scoop Afrique',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Scoop.Afrique',
      url: config.siteUrl,
      logo: { '@type': 'ImageObject', url: `${config.siteUrl}/brand-logo.svg` },
    },
    isAccessibleForFree: true,
    copyrightHolder: { '@type': 'Organization', name: 'Scoop.Afrique' },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

function ArticleBreadcrumbJsonLd({
  title,
  categoryName,
  categorySlug,
  articleUrl,
}: {
  title: string
  categoryName: string | null
  categorySlug: string | null
  articleUrl: string
}) {
  const origin = config.siteUrl.replace(/\/$/, '')
  const items: { name: string; item: string }[] = [
    { name: 'Accueil', item: `${origin}/` },
    { name: 'Articles', item: `${origin}/articles` },
  ]
  if (categoryName && categorySlug) {
    items.push({
      name: categoryName,
      item: `${origin}/category/${encodeURIComponent(categorySlug)}`,
    })
  }
  items.push({ name: title, item: articleUrl })
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
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
      <ArticleBreadcrumbJsonLd
        title={article.title}
        categoryName={article.category?.name ?? null}
        categorySlug={article.category?.slug ?? null}
        articleUrl={shareUrl}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          <article className="min-w-0 lg:col-span-8">
            <Link
              href="/articles"
              className="mb-6 inline-block text-xs font-semibold uppercase tracking-wider text-primary transition-opacity hover:opacity-80"
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

            <header className="mb-8">
              <Heading
                as="h1"
                level="h1"
                className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {article.title}
              </Heading>
              {article.excerpt ? (
                <Text variant="lead" className="mt-4 text-lg text-editorial-secondary md:text-xl">
                  {article.excerpt}
                </Text>
              ) : null}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-editorial-outline-variant/15 py-6">
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

            {hasCoverImage && (
              <div className="relative -mx-4 mb-12 overflow-hidden rounded-xl sm:mx-0 md:-mx-6">
                <Thumbnail
                  src={coverImageUrl}
                  alt={`Illustration — ${article.title}`}
                  aspectRatio="video"
                  className="w-full rounded-xl shadow-[var(--shadow-lg)]"
                />
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

            <footer className="border-t border-editorial-outline-variant/15 pt-6">
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

            <ArticleCommentsSection articleId={article.id} />
          </article>

          <aside className="mt-10 space-y-8 lg:col-span-4 lg:mt-0">
            <StickyRail offset="6rem" className="space-y-8">
              <ArticleContextRail title={railTitle} articles={contextArticles} />
              {railAd ? (
                <AdSlotSection slotKey={AD_SLOT_KEYS.ARTICLE_RAIL} creative={railAd.creative} articleId={article.id} />
              ) : null}
            </StickyRail>
          </aside>
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
