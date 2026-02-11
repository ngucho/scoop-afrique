import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { ArticleBody } from '@/components/reader/ArticleBody'
import { ShareButtons } from '@/components/reader/ShareButtons'
import { LikeButton } from '@/components/reader/LikeButton'
import { CategoryTags } from '@/components/reader/CategoryTags'
import { RelatedArticles } from '@/components/reader/RelatedArticles'
import { Heading, Text, MetaBar, Thumbnail } from 'scoop'
import { apiGet } from '@/lib/api/client'
import type { ArticleResponse, LikesResponse } from '@/lib/api/types'
import { config } from '@/lib/config'
import { formatDate } from '@/lib/formatDate'
import { toYoutubeEmbedUrl } from '@/lib/youtube'

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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Scoop.Afrique',
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
      locale: 'fr_FR',
      type: 'article',
      publishedTime: article.published_at ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: { canonical: url },
  }
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  const likes = await getLikes(article.id)
  const shareUrl = `${config.siteUrl}/articles/${article.slug}`

  const coverImageUrl = (article as unknown as Record<string, unknown>).cover_image_url as
    | string
    | null
    | undefined
  const videoUrl = (article as unknown as Record<string, unknown>).video_url as
    | string
    | null
    | undefined
  const videoEmbedUrl = videoUrl ? toYoutubeEmbedUrl(videoUrl) : null
  const hasCoverImage = !!coverImageUrl
  const hasCoverVideo = !hasCoverImage && !!videoEmbedUrl
  const showVideoAtEnd = hasCoverImage && !!videoEmbedUrl

  return (
    <ReaderLayout>
      <article className="mx-auto max-w-3xl px-4 py-8 lg:px-8 page-enter">
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

        {/* Cover: image if set, else video if set */}
        {hasCoverImage && (
          <div className="mb-8 overflow-hidden rounded-xl">
            <Thumbnail
              src={coverImageUrl}
              alt=""
              aspectRatio="video"
              className="w-full"
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
        </header>

        <ArticleBody content={article.content} className="mb-10" />

        {/* Vidéo en fin d'article si image de couverture + vidéo */}
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
      </article>

      <div className="mx-auto max-w-6xl px-4 pb-12 lg:px-8">
        <RelatedArticles excludeSlug={article.slug} className="mt-12" />
      </div>
    </ReaderLayout>
  )
}
