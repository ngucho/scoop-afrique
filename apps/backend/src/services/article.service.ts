/**
 * Article service — CRUD, listing, search.
 * Cover images: URL or Supabase Storage.
 * Videos: always YouTube embed URL (no upload).
 *
 * Integrations:
 * - Creates revisions on manual save and publish.
 * - Computes word_count / reading_time_min on every save.
 * - Uses collaborator service for canEdit checks.
 */
import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'
import type { CreateArticleBody, UpdateArticleBody } from '../schemas/article.js'
import type { AppRole } from './profile.service.js'
import { createRevision } from './revision.service.js'
import { canEditArticle } from './collaborator.service.js'

/* ---------- Types ---------- */

export type ArticleStatus = 'draft' | 'review' | 'scheduled' | 'published'

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  video_url: string | null
  content: unknown
  category_id: string | null
  author_id: string
  author_display_name: string | null
  tags: string[]
  status: ArticleStatus
  published_at: string | null
  scheduled_at: string | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  view_count: number
  word_count: number
  reading_time_min: number
  version: number
  last_saved_by: string | null
  created_at: string
  updated_at: string
}

export interface ArticleWithAuthor extends Article {
  author?: { email: string | null } | null
  category?: { id: string; name: string; slug: string } | null
}

export interface ListOptions {
  category?: string
  q?: string
  page?: number
  limit?: number
  status?: ArticleStatus
  authorId?: string
  tag?: string
  /** If true, return all statuses (admin listing). */
  allowAllStatuses?: boolean
}

/* ---------- Helpers ---------- */

/** Recursively extract plain text from TipTap JSON for word count. */
function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  let text = ''
  if (n.type === 'text' && typeof n.text === 'string') text += n.text + ' '
  if (Array.isArray(n.content)) {
    for (const child of n.content) text += extractText(child)
  }
  return text
}

function computeWordCount(content: unknown): number {
  const text = extractText(content).trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

function computeReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'article'
}

/** Return a slug that is unique in articles. If base exists, appends -2, -3, etc. */
async function ensureUniqueSlug(
  supabase: ReturnType<typeof getSupabase>,
  baseSlug: string,
  excludeArticleId?: string
): Promise<string> {
  let slug = baseSlug
  let n = 1
  for (;;) {
    let query = supabase.from('articles').select('id').eq('slug', slug).limit(1)
    if (excludeArticleId) query = query.neq('id', excludeArticleId)
    const { data } = await query
    if (!data?.length) return slug
    n += 1
    slug = `${baseSlug}-${n}`
  }
}

const ARTICLE_SELECT = `
  *,
  author:profiles!articles_author_id_fkey(email),
  category:categories!articles_category_id_fkey(id, name, slug)
`

/* ---------- List ---------- */

export async function listArticles(
  options: ListOptions
): Promise<{ data: ArticleWithAuthor[]; total: number }> {
  if (!config.supabase) return { data: [], total: 0 }
  const supabase = getSupabase()
  const limit = Math.min(options.limit ?? 20, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  let query = supabase.from('articles').select(ARTICLE_SELECT, { count: 'exact' })

  // Status filter
  if (options.status) {
    query = query.eq('status', options.status)
    if (options.status === 'published') {
      query = query.not('published_at', 'is', null)
    }
  } else if (!options.allowAllStatuses) {
    query = query.eq('status', 'published').not('published_at', 'is', null)
  }

  // Category filter (by slug)
  if (options.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
    else return { data: [], total: 0 }
  }

  // Author filter
  if (options.authorId) {
    query = query.eq('author_id', options.authorId)
  }

  // Tag filter (array contains)
  if (options.tag) {
    query = query.contains('tags', [options.tag])
  }

  // Full-text search
  if (options.q) {
    query = query.or(`title.ilike.%${options.q}%,excerpt.ilike.%${options.q}%`)
  }

  query = query
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as ArticleWithAuthor[], total: count ?? 0 }
}

/* ---------- Get by ID / slug ---------- */

export async function getArticleByIdOrSlug(
  idOrSlug: string,
  onlyPublished = true
): Promise<ArticleWithAuthor | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    )
  let query = supabase.from('articles').select(ARTICLE_SELECT).limit(1)
  if (isUuid) query = query.eq('id', idOrSlug)
  else query = query.eq('slug', idOrSlug)
  if (onlyPublished) query = query.eq('status', 'published')
  const { data, error } = await query.single()
  if (error || !data) return null
  return data as ArticleWithAuthor
}

/* ---------- Increment view count ---------- */

export async function incrementViewCount(articleId: string): Promise<void> {
  if (!config.supabase) return
  const supabase = getSupabase()
  const { error } = await supabase.rpc('increment_view_count', { article_id: articleId })
  if (error) {
    // Fallback: direct update (if RPC not available yet)
    try {
      await supabase
        .from('articles')
        .update({ view_count: 1 })
        .eq('id', articleId)
    } catch {
      // Silently fail — view count is non-critical
    }
  }
}

/* ---------- Create ---------- */

export async function createArticle(
  body: CreateArticleBody,
  authorId: string
): Promise<Article> {
  if (!config.supabase) throw new Error('Supabase not configured')
  const supabase = getSupabase()
  const baseSlug = body.slug ?? slugify(body.title)
  const slug = await ensureUniqueSlug(supabase, baseSlug)

  const contentData = body.content ?? []
  const wordCount = computeWordCount(contentData)

  const { data, error } = await supabase
    .from('articles')
    .insert({
      title: body.title,
      slug,
      excerpt: body.excerpt ?? null,
      category_id: body.category_id ?? null,
      content: contentData,
      cover_image_url: body.cover_image_url ?? null,
      video_url: body.video_url ?? null,
      tags: body.tags ?? [],
      author_id: authorId,
      author_display_name: body.author_display_name ?? null,
      status: body.status ?? 'draft',
      meta_title: body.meta_title ?? null,
      meta_description: body.meta_description ?? null,
      og_image_url: body.og_image_url ?? null,
      scheduled_at: body.scheduled_at ?? null,
      word_count: wordCount,
      reading_time_min: computeReadingTime(wordCount),
      version: 1,
      last_saved_by: authorId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Article
}

/* ---------- Update ---------- */

export interface UpdateOptions {
  /** If true, create a revision snapshot (manual save / publish). */
  createRevision?: boolean
  /** If true, this is an autosave — skip revision. */
  autosave?: boolean
}

export async function updateArticle(
  id: string,
  body: UpdateArticleBody,
  userId: string,
  role: AppRole,
  options: UpdateOptions = {},
): Promise<Article | null> {
  if (!config.supabase) return null
  const supabase = getSupabase()

  const existing = await supabase
    .from('articles')
    .select('author_id, status, title, excerpt, content, version')
    .eq('id', id)
    .single()
  if (existing.error || !existing.data) return null

  // Collaborator-aware permission check (author, collaborator, or editor+)
  const allowed = await canEditArticle(id, userId, role)
  if (!allowed) return null

  const update: Record<string, unknown> = { ...body }

  // Ensure slug is unique when updating (exclude current article)
  if (typeof update.slug === 'string' && update.slug.trim()) {
    update.slug = await ensureUniqueSlug(supabase, update.slug.trim(), id)
  }

  // Set published_at when publishing for the first time
  if (body.status === 'published' && existing.data.status !== 'published') {
    update.published_at = new Date().toISOString()
  }

  // Compute word count whenever content is updated
  if (body.content !== undefined) {
    const wc = computeWordCount(body.content)
    update.word_count = wc
    update.reading_time_min = computeReadingTime(wc)
  }

  update.last_saved_by = userId

  // Create revision for manual saves and publishes
  const shouldRevision =
    options.createRevision ||
    body.status === 'published' ||
    (!options.autosave && body.content !== undefined)
  if (shouldRevision) {
    const revTitle = (body.title ?? existing.data.title) as string
    const revExcerpt = (body.excerpt !== undefined ? body.excerpt : existing.data.excerpt) as string | null
    const revContent = body.content ?? existing.data.content
    const { version: newVersion } = await createRevision(id, revContent, revTitle, revExcerpt, userId)
    update.version = newVersion
  }

  const { data, error } = await supabase
    .from('articles')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Article
}

/* ---------- Delete ---------- */

export async function deleteArticle(id: string, role: AppRole): Promise<boolean> {
  if (!['manager', 'admin'].includes(role)) return false
  if (!config.supabase) return false
  const supabase = getSupabase()
  const { error } = await supabase.from('articles').delete().eq('id', id)
  return !error
}
