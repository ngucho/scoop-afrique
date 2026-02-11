/**
 * Comment service — CRUD + moderation for article comments.
 * Comments are created in "pending" status and must be approved by staff.
 * Supports nested replies via parent_id.
 */
import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'

export type CommentStatus = 'pending' | 'approved' | 'rejected'

export interface Comment {
  id: string
  article_id: string
  user_id: string
  parent_id: string | null
  body: string
  status: CommentStatus
  created_at: string
  updated_at: string
}

export interface CommentWithAuthor extends Comment {
  author?: { email: string | null } | null
}

const COMMENT_SELECT = `
  *,
  author:profiles!comments_user_id_fkey(email)
`

/* ---------- List approved comments for an article ---------- */

export async function listArticleComments(
  articleId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ data: CommentWithAuthor[]; total: number }> {
  if (!config.supabase) return { data: [], total: 0 }
  const supabase = getSupabase()
  const limit = Math.min(options.limit ?? 50, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const { data, error, count } = await supabase
    .from('comments')
    .select(COMMENT_SELECT, { count: 'exact' })
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  return { data: (data ?? []) as CommentWithAuthor[], total: count ?? 0 }
}

/* ---------- Create comment (pending) ---------- */

export async function createComment(
  articleId: string,
  userId: string,
  body: string,
  parentId: string | null = null
): Promise<Comment> {
  if (!config.supabase) throw new Error('Supabase not configured')
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('comments')
    .insert({
      article_id: articleId,
      user_id: userId,
      body,
      parent_id: parentId ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Comment
}

/* ---------- Edit own comment ---------- */

export async function updateComment(
  commentId: string,
  userId: string,
  body: string
): Promise<Comment | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()
  if (!existing || existing.user_id !== userId) return null

  const { data, error } = await supabase
    .from('comments')
    .update({ body, status: 'pending' }) // Re-moderate after edit
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Comment
}

/* ---------- Delete own comment ---------- */

export async function deleteComment(
  commentId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()

  // Admin/manager can delete any; author can delete own
  if (['admin', 'manager'].includes(userRole)) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    return !error
  }

  const { data: existing } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()
  if (!existing || existing.user_id !== userId) return false

  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  return !error
}

/* ---------- Admin: list all comments (any status) ---------- */

export async function listAllComments(options: {
  status?: CommentStatus
  page?: number
  limit?: number
}): Promise<{ data: CommentWithAuthor[]; total: number }> {
  if (!config.supabase) return { data: [], total: 0 }
  const supabase = getSupabase()
  const limit = Math.min(options.limit ?? 50, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  let query = supabase
    .from('comments')
    .select(COMMENT_SELECT, { count: 'exact' })

  if (options.status) query = query.eq('status', options.status)

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as CommentWithAuthor[], total: count ?? 0 }
}

/* ---------- Admin: moderate comment ---------- */

export async function moderateComment(
  commentId: string,
  status: CommentStatus
): Promise<Comment | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('comments')
    .update({ status })
    .eq('id', commentId)
    .select()
    .single()

  if (error) return null
  return data as Comment
}
