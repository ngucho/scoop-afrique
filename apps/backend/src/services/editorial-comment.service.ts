/**
 * Editorial comment service — staff feedback on articles during editing/review.
 * These are NOT reader-facing comments; they are internal to the newsroom.
 */
import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'

export interface EditorialComment {
  id: string
  article_id: string
  author_id: string | null
  body: string
  resolved: boolean
  created_at: string
  updated_at: string
  /** Joined profile */
  author?: { email: string | null } | null
}

const SELECT = `*, author:profiles!editorial_comments_author_id_fkey(email)`

/** Add an editorial comment to an article. */
export async function addEditorialComment(
  articleId: string,
  authorId: string,
  body: string,
): Promise<EditorialComment> {
  if (!config.supabase) throw new Error('Supabase not configured')
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('editorial_comments')
    .insert({ article_id: articleId, author_id: authorId, body })
    .select(SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as EditorialComment
}

/** List editorial comments for an article. */
export async function listEditorialComments(
  articleId: string,
  includeResolved = false,
): Promise<EditorialComment[]> {
  if (!config.supabase) return []
  const supabase = getSupabase()

  let query = supabase
    .from('editorial_comments')
    .select(SELECT)
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })

  if (!includeResolved) {
    query = query.eq('resolved', false)
  }

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as EditorialComment[]
}

/** Mark a comment as resolved. */
export async function resolveEditorialComment(commentId: string): Promise<EditorialComment | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('editorial_comments')
    .update({ resolved: true })
    .eq('id', commentId)
    .select(SELECT)
    .single()

  if (error) return null
  return data as EditorialComment
}

/** Delete an editorial comment. Only author or editor+ can delete. */
export async function deleteEditorialComment(
  commentId: string,
  userId: string,
  userRole: string,
): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()

  if (['editor', 'manager', 'admin'].includes(userRole)) {
    const { error } = await supabase.from('editorial_comments').delete().eq('id', commentId)
    return !error
  }

  // Author can delete own
  const { data: existing } = await supabase
    .from('editorial_comments')
    .select('author_id')
    .eq('id', commentId)
    .single()
  if (!existing || existing.author_id !== userId) return false

  const { error } = await supabase.from('editorial_comments').delete().eq('id', commentId)
  return !error
}

/** Count unresolved editorial comments for an article. */
export async function countUnresolved(articleId: string): Promise<number> {
  if (!config.supabase) return 0
  const supabase = getSupabase()

  const { count } = await supabase
    .from('editorial_comments')
    .select('id', { count: 'exact', head: true })
    .eq('article_id', articleId)
    .eq('resolved', false)

  return count ?? 0
}
