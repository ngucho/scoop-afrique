/**
 * Notification service — alerts for article owners (e.g. comments on their articles).
 */
import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'

export interface EditorialNotificationItem {
  article_id: string
  article_title: string
  article_slug: string
  unresolved_count: number
}

export interface ReaderCommentNotificationItem {
  article_id: string
  article_title: string
  article_slug: string
  pending_count: number
}

export interface UserNotifications {
  editorial: EditorialNotificationItem[]
  editorial_total: number
  reader_pending: ReaderCommentNotificationItem[]
  reader_pending_total: number
}

/** Get notifications for the current user (as article author): editorial comments + reader comments on their articles. */
export async function getNotificationsForUser(
  authorId: string,
): Promise<UserNotifications> {
  if (!config.supabase) {
    return {
      editorial: [],
      editorial_total: 0,
      reader_pending: [],
      reader_pending_total: 0,
    }
  }
  const supabase = getSupabase()

  const { data: myArticles } = await supabase
    .from('articles')
    .select('id, title, slug')
    .eq('author_id', authorId)
  const articleIds = (myArticles ?? []).map((a) => a.id)
  const articleMap = new Map((myArticles ?? []).map((a) => [a.id, { title: a.title, slug: a.slug }]))

  if (articleIds.length === 0) {
    return {
      editorial: [],
      editorial_total: 0,
      reader_pending: [],
      reader_pending_total: 0,
    }
  }

  const [editorialRes, readerRes] = await Promise.all([
    supabase
      .from('editorial_comments')
      .select('article_id')
      .in('article_id', articleIds)
      .eq('resolved', false),
    supabase
      .from('comments')
      .select('article_id')
      .in('article_id', articleIds)
      .eq('status', 'pending'),
  ])

  const editorialByArticle = new Map<string, number>()
  for (const row of editorialRes.data ?? []) {
    const id = row.article_id as string
    editorialByArticle.set(id, (editorialByArticle.get(id) ?? 0) + 1)
  }
  const readerByArticle = new Map<string, number>()
  for (const row of readerRes.data ?? []) {
    const id = row.article_id as string
    readerByArticle.set(id, (readerByArticle.get(id) ?? 0) + 1)
  }

  const editorial: EditorialNotificationItem[] = []
  for (const [articleId, count] of editorialByArticle) {
    const art = articleMap.get(articleId)
    if (art) editorial.push({ article_id: articleId, article_title: art.title, article_slug: art.slug, unresolved_count: count })
  }
  const reader_pending: ReaderCommentNotificationItem[] = []
  for (const [articleId, count] of readerByArticle) {
    const art = articleMap.get(articleId)
    if (art) reader_pending.push({ article_id: articleId, article_title: art.title, article_slug: art.slug, pending_count: count })
  }

  return {
    editorial,
    editorial_total: editorial.reduce((s, i) => s + i.unresolved_count, 0),
    reader_pending,
    reader_pending_total: reader_pending.reduce((s, i) => s + i.pending_count, 0),
  }
}
