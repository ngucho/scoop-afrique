/**
 * Article collaborator service — manage who can co-edit an article.
 * Collaborators can edit an article they don't own (but not simultaneously — locks apply).
 */
import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'
import type { AppRole } from './profile.service.js'

export type CollabRole = 'contributor' | 'co_author'

export interface Collaborator {
  id: string
  article_id: string
  user_id: string
  role: CollabRole
  added_by: string | null
  created_at: string
  /** Joined profile */
  user?: { email: string | null } | null
}

const COLLAB_SELECT = `*, user:profiles!article_collaborators_user_id_fkey(email)`

/** Add a collaborator. Returns the collaborator or null if already exists. */
export async function addCollaborator(
  articleId: string,
  userId: string,
  role: CollabRole,
  addedBy: string,
): Promise<Collaborator | null> {
  if (!config.supabase) throw new Error('Supabase not configured')
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('article_collaborators')
    .upsert(
      { article_id: articleId, user_id: userId, role, added_by: addedBy },
      { onConflict: 'article_id,user_id' },
    )
    .select(COLLAB_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as Collaborator
}

/** Remove a collaborator. */
export async function removeCollaborator(articleId: string, userId: string): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()
  const { error } = await supabase
    .from('article_collaborators')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId)
  return !error
}

/** List collaborators for an article. */
export async function listCollaborators(articleId: string): Promise<Collaborator[]> {
  if (!config.supabase) return []
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('article_collaborators')
    .select(COLLAB_SELECT)
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })

  if (error) return []
  return (data ?? []) as Collaborator[]
}

/**
 * Check if a user can edit an article.
 * Can edit if: author, collaborator, or editor+.
 */
export async function canEditArticle(
  articleId: string,
  userId: string,
  userRole: AppRole,
): Promise<boolean> {
  // Editors, managers, admins can always edit
  if (['editor', 'manager', 'admin'].includes(userRole)) return true

  if (!config.supabase) return false
  const supabase = getSupabase()

  // Check if author
  const { data: article } = await supabase
    .from('articles')
    .select('author_id')
    .eq('id', articleId)
    .single()
  if (article?.author_id === userId) return true

  // Check if collaborator
  const { data: collab } = await supabase
    .from('article_collaborators')
    .select('id')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .limit(1)
    .single()
  return !!collab
}

/** Find a user profile by email. Returns profile id or null. */
export async function findProfileByEmail(email: string): Promise<string | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1)
    .single()
  return data?.id ?? null
}
