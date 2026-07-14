export type ArticleEditorPayloadInput = {
  isEditing: boolean
  authorName: string
  title: string
  excerpt: string
  content: unknown
  categoryId: string
  coverImageUrl: string
  coverImageCredit: string
  coverImageSource: string
  videoUrl: string
  coverVideoCredit: string
  tags: string
  metaTitle: string
  metaDescription: string
}

export type ArticleEditorPayload = {
  title: string
  excerpt: string | null
  content: unknown
  category_id: string | null
  cover_image_url: string | null
  cover_image_credit: string | null
  cover_image_source: string | null
  video_url: string | null
  cover_video_credit: string | null
  tags: string[]
  meta_title: string | null
  meta_description: string | null
  author_display_name?: string
}

function textOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeTags(value: string): string[] {
  const seen = new Set<string>()
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLocaleLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 20)
}

export function buildArticleEditorPayload(input: ArticleEditorPayloadInput): ArticleEditorPayload {
  const payload: ArticleEditorPayload = {
    title: input.title.trim(),
    excerpt: textOrNull(input.excerpt),
    content: input.content,
    category_id: textOrNull(input.categoryId),
    cover_image_url: textOrNull(input.coverImageUrl),
    cover_image_credit: textOrNull(input.coverImageCredit),
    cover_image_source: textOrNull(input.coverImageSource),
    video_url: textOrNull(input.videoUrl),
    cover_video_credit: textOrNull(input.coverVideoCredit),
    tags: normalizeTags(input.tags),
    meta_title: textOrNull(input.metaTitle),
    meta_description: textOrNull(input.metaDescription),
  }

  const authorDisplayName = input.authorName.trim()
  if (!input.isEditing && authorDisplayName) {
    payload.author_display_name = authorDisplayName
  }

  return payload
}
