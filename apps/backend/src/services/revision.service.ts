/**
 * Article revision service — version history and rollback.
 * A revision is created on every manual save and on publish.
 * Only the 3 latest revisions per article are kept to save storage.
 */
import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'

const MAX_REVISIONS_PER_ARTICLE = 3

export interface ArticleRevision {
  id: string
  article_id: string
  content: unknown
  title: string
  excerpt: string | null
  version: number
  created_by: string | null
  created_at: string
  /** Joined */
  author?: { email: string | null } | null
}

const REVISION_SELECT = `*, author:profiles!article_revisions_created_by_fkey(email)`

/** Create a new revision for an article. Returns the version number. */
export async function createRevision(
  articleId: string,
  content: unknown,
  title: string,
  excerpt: string | null,
  userId: string,
): Promise<{ revision: ArticleRevision; version: number }> {
  if (!config.supabase) throw new Error('Supabase not configured')
  const supabase = getSupabase()

  // Get next version number
  const { data: latest } = await supabase
    .from('article_revisions')
    .select('version')
    .eq('article_id', articleId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = (latest?.version ?? 0) + 1

  const { data, error } = await supabase
    .from('article_revisions')
    .insert({
      article_id: articleId,
      content,
      title,
      excerpt: excerpt ?? null,
      version: nextVersion,
      created_by: userId,
    })
    .select(REVISION_SELECT)
    .single()

  if (error) throw new Error(error.message)

  await pruneRevisions(supabase, articleId, MAX_REVISIONS_PER_ARTICLE)
  return { revision: data as ArticleRevision, version: nextVersion }
}

/** Keep only the latest N revisions for an article; delete older ones. */
async function pruneRevisions(
  supabase: ReturnType<typeof getSupabase>,
  articleId: string,
  keep: number,
): Promise<void> {
  const { data: kept } = await supabase
    .from('article_revisions')
    .select('version')
    .eq('article_id', articleId)
    .order('version', { ascending: false })
    .limit(keep)
  const versions = (kept ?? []).map((r) => r.version)
  if (versions.length < keep) return
  const minVersionToKeep = Math.min(...versions)
  await supabase
    .from('article_revisions')
    .delete()
    .eq('article_id', articleId)
    .lt('version', minVersionToKeep)
}

/** List revisions for an article, newest first. */
export async function listRevisions(
  articleId: string,
  page = 1,
  limit = 20,
): Promise<{ data: ArticleRevision[]; total: number }> {
  if (!config.supabase) return { data: [], total: 0 }
  const supabase = getSupabase()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('article_revisions')
    .select(REVISION_SELECT, { count: 'exact' })
    .eq('article_id', articleId)
    .order('version', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  return { data: (data ?? []) as ArticleRevision[], total: count ?? 0 }
}

/** Get a specific revision by version number. */
export async function getRevision(
  articleId: string,
  version: number,
): Promise<ArticleRevision | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()

  const { data } = await supabase
    .from('article_revisions')
    .select(REVISION_SELECT)
    .eq('article_id', articleId)
    .eq('version', version)
    .single()

  return (data as ArticleRevision) ?? null
}

/** Restore an article to a specific revision. Creates a new revision as well. */
export async function restoreRevision(
  articleId: string,
  version: number,
  userId: string,
): Promise<ArticleRevision | null> {
  const rev = await getRevision(articleId, version)
  if (!rev) return null

  // Create a new revision with the restored content
  const { revision } = await createRevision(
    articleId,
    rev.content,
    rev.title,
    rev.excerpt,
    userId,
  )

  // Update the article itself
  if (config.supabase) {
    const supabase = getSupabase()
    await supabase
      .from('articles')
      .update({
        content: rev.content,
        title: rev.title,
        excerpt: rev.excerpt,
        version: revision.version,
        last_saved_by: userId,
      })
      .eq('id', articleId)
  }

  return revision
}
