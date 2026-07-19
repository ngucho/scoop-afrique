import type { Article } from '@/lib/api/types'

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatReaderDate(value: string | null | undefined, withTime = false): string | null {
  const date = parseDate(value)
  if (!date) return null
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

export function articleDateLine(article: Pick<Article, 'published_at' | 'updated_at'>): string | null {
  const published = parseDate(article.published_at)
  const updated = parseDate(article.updated_at)
  const publishedLabel = formatReaderDate(article.published_at, true)
  const updatedLabel = formatReaderDate(article.updated_at, true)

  if (!published && updatedLabel) return `Mis a jour le ${updatedLabel}`
  if (!publishedLabel) return null

  if (published && updated && updated.getTime() - published.getTime() > 30 * 60 * 1000 && updatedLabel) {
    return `Publie le ${publishedLabel} - mis a jour le ${updatedLabel}`
  }

  return `Publie le ${publishedLabel}`
}

export function mediaCreditLine(article: Pick<Article, 'cover_image_credit' | 'cover_image_source' | 'cover_video_credit'>): string | null {
  const credit = article.cover_image_credit?.trim()
  const source = article.cover_image_source?.trim()
  const videoCredit = article.cover_video_credit?.trim()
  if (credit && source) return `Credit: ${credit} - Source: ${source}`
  if (credit) return `Credit: ${credit}`
  if (source) return `Source: ${source}`
  if (videoCredit) return `Credit video: ${videoCredit}`
  return null
}
