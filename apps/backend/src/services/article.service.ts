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
import { eq, and, desc, sql, or, ilike, isNotNull } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { articles, categories, profiles, readerPublicProfiles } from '../db/schema.js'
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
  author_public?: { bio: string | null; avatar_url: string | null } | null
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
  db: ReturnType<typeof getDb>,
  baseSlug: string,
  excludeArticleId?: string
): Promise<string> {
  let slug = baseSlug
  let n = 1
  for (;;) {
    const conditions = excludeArticleId
      ? and(eq(articles.slug, slug), sql`${articles.id} != ${excludeArticleId}`)
      : eq(articles.slug, slug)
    const [row] = await db.select({ id: articles.id }).from(articles).where(conditions).limit(1)
    if (!row) return slug
    n += 1
    slug = `${baseSlug}-${n}`
  }
}

function toArticle(row: Record<string, unknown>): Article {
  const r = row as typeof articles.$inferSelect
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    cover_image_url: r.coverImageUrl,
    video_url: r.videoUrl,
    content: r.content,
    category_id: r.categoryId,
    author_id: r.authorId,
    author_display_name: r.authorDisplayName,
    tags: r.tags ?? [],
    status: r.status as ArticleStatus,
    published_at: r.publishedAt?.toISOString() ?? null,
    scheduled_at: r.scheduledAt?.toISOString() ?? null,
    meta_title: r.metaTitle,
    meta_description: r.metaDescription,
    og_image_url: r.ogImageUrl,
    view_count: r.viewCount ?? 0,
    word_count: r.wordCount ?? 0,
    reading_time_min: r.readingTimeMin ?? 1,
    version: r.version ?? 1,
    last_saved_by: r.lastSavedBy,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

function toArticleWithAuthor(
  row: Record<string, unknown>,
): ArticleWithAuthor {
  const r = row as typeof articles.$inferSelect & {
    authorEmail?: string | null
    categoryId?: string
    categoryName?: string
    categorySlug?: string
    journalistPublicBio?: string | null
    journalistPublicAvatarUrl?: string | null
    readerPublicBio?: string | null
    readerPublicAvatarUrl?: string | null
  }
  const bioJournalist = r.journalistPublicBio?.trim() ?? ''
  const bioReader = r.readerPublicBio?.trim() ?? ''
  const mergedBio = bioJournalist || bioReader ? (bioJournalist || bioReader) : null
  const avatarJournalist = r.journalistPublicAvatarUrl?.trim() ?? ''
  const avatarReader = r.readerPublicAvatarUrl?.trim() ?? ''
  const mergedAvatar = avatarJournalist || avatarReader || null
  const hasPublic = !!(mergedBio || mergedAvatar)
  return {
    ...toArticle(r),
    author: r.authorEmail != null ? { email: r.authorEmail } : null,
    author_public: hasPublic
      ? {
          bio: mergedBio,
          avatar_url: mergedAvatar,
        }
      : null,
    category: r.categoryId && r.categoryName && r.categorySlug ? { id: r.categoryId, name: r.categoryName, slug: r.categorySlug } : null,
  }
}

/* ---------- List ---------- */

export async function listArticles(
  options: ListOptions
): Promise<{ data: ArticleWithAuthor[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(options.limit ?? 20, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const conditions: ReturnType<typeof eq>[] = []

  if (options.status) {
    conditions.push(eq(articles.status, options.status))
    if (options.status === 'published') {
      conditions.push(isNotNull(articles.publishedAt))
    }
  } else if (!options.allowAllStatuses) {
    conditions.push(eq(articles.status, 'published'))
    conditions.push(isNotNull(articles.publishedAt))
  }

  if (options.category) {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, options.category)).limit(1)
    if (!cat) return { data: [], total: 0 }
    conditions.push(eq(articles.categoryId, cat.id))
  }

  if (options.authorId) {
    conditions.push(eq(articles.authorId, options.authorId))
  }

  if (options.tag) {
    conditions.push(sql`${options.tag} = ANY(${articles.tags})`)
  }

  if (options.q) {
    conditions.push(or(ilike(articles.title, `%${options.q}%`), ilike(articles.excerpt, `%${options.q}%`))!)
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .where(whereClause)
  const total = countRow?.count ?? 0

  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      videoUrl: articles.videoUrl,
      content: articles.content,
      categoryId: articles.categoryId,
      authorId: articles.authorId,
      authorDisplayName: articles.authorDisplayName,
      tags: articles.tags,
      status: articles.status,
      publishedAt: articles.publishedAt,
      scheduledAt: articles.scheduledAt,
      metaTitle: articles.metaTitle,
      metaDescription: articles.metaDescription,
      ogImageUrl: articles.ogImageUrl,
      viewCount: articles.viewCount,
      wordCount: articles.wordCount,
      readingTimeMin: articles.readingTimeMin,
      version: articles.version,
      lastSavedBy: articles.lastSavedBy,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorEmail: profiles.email,
      catId: categories.id,
      catName: categories.name,
      catSlug: categories.slug,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(whereClause)
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset)

  const data = rows.map((r) =>
    toArticleWithAuthor({
      ...r,
      categoryId: r.catId ?? undefined,
      categoryName: r.catName ?? undefined,
      categorySlug: r.catSlug ?? undefined,
    })
  )
  return { data, total }
}

/* ---------- Get by ID / slug ---------- */

export async function getArticleByIdOrSlug(
  idOrSlug: string,
  onlyPublished = true
): Promise<ArticleWithAuthor | null> {
  if (!config.database) return null
  const db = getDb()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  const conditions = isUuid ? eq(articles.id, idOrSlug) : eq(articles.slug, idOrSlug)
  const statusCondition = onlyPublished ? eq(articles.status, 'published') : undefined
  const whereClause = statusCondition ? and(conditions, statusCondition) : conditions

  const [row] = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      videoUrl: articles.videoUrl,
      content: articles.content,
      categoryId: articles.categoryId,
      authorId: articles.authorId,
      authorDisplayName: articles.authorDisplayName,
      tags: articles.tags,
      status: articles.status,
      publishedAt: articles.publishedAt,
      scheduledAt: articles.scheduledAt,
      metaTitle: articles.metaTitle,
      metaDescription: articles.metaDescription,
      ogImageUrl: articles.ogImageUrl,
      viewCount: articles.viewCount,
      wordCount: articles.wordCount,
      readingTimeMin: articles.readingTimeMin,
      version: articles.version,
      lastSavedBy: articles.lastSavedBy,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorEmail: profiles.email,
      journalistPublicBio: profiles.journalistPublicBio,
      journalistPublicAvatarUrl: profiles.journalistPublicAvatarUrl,
      readerPublicBio: readerPublicProfiles.bio,
      readerPublicAvatarUrl: readerPublicProfiles.avatarUrl,
      catId: categories.id,
      catName: categories.name,
      catSlug: categories.slug,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(whereClause)
    .limit(1)

  if (!row) return null
  return toArticleWithAuthor({
    ...row,
    categoryId: row.catId ?? undefined,
    categoryName: row.catName ?? undefined,
    categorySlug: row.catSlug ?? undefined,
  })
}

/* ---------- Increment view count ---------- */

export async function incrementViewCount(articleId: string): Promise<void> {
  if (!config.database) return
  const db = getDb()
  try {
    await db.execute(sql`SELECT increment_view_count(${articleId}::uuid)`)
  } catch {
    try {
      await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq(articles.id, articleId))
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
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const baseSlug = body.slug ?? slugify(body.title)
  const slug = await ensureUniqueSlug(db, baseSlug)

  const contentData = body.content ?? []
  const wordCount = computeWordCount(contentData)

  const [row] = await db
    .insert(articles)
    .values({
      title: body.title,
      slug,
      excerpt: body.excerpt ?? null,
      categoryId: body.category_id ?? null,
      content: contentData as typeof articles.$inferInsert.content,
      coverImageUrl: body.cover_image_url ?? null,
      videoUrl: body.video_url ?? null,
      tags: body.tags ?? [],
      authorId,
      authorDisplayName: body.author_display_name ?? null,
      status: (body.status ?? 'draft') as 'draft' | 'review' | 'scheduled' | 'published',
      metaTitle: body.meta_title ?? null,
      metaDescription: body.meta_description ?? null,
      ogImageUrl: body.og_image_url ?? null,
      scheduledAt: body.scheduled_at ? new Date(body.scheduled_at) : null,
      wordCount,
      readingTimeMin: computeReadingTime(wordCount),
      version: 1,
      lastSavedBy: authorId,
    })
    .returning()

  if (!row) throw new Error('Failed to create article')
  return toArticle(row)
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
  if (!config.database) return null
  const db = getDb()

  const [existing] = await db
    .select({ authorId: articles.authorId, status: articles.status, title: articles.title, excerpt: articles.excerpt, content: articles.content, version: articles.version })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)
  if (!existing) return null

  const allowed = await canEditArticle(id, userId, role)
  if (!allowed) return null

  const update: Partial<typeof articles.$inferInsert> = {}
  if (body.title !== undefined) update.title = body.title
  if (body.slug !== undefined && body.slug.trim()) update.slug = body.slug.trim()
  if (body.excerpt !== undefined) update.excerpt = body.excerpt
  if (body.category_id !== undefined) update.categoryId = body.category_id || null
  if (body.content !== undefined) update.content = body.content as never
  if (body.cover_image_url !== undefined) update.coverImageUrl = body.cover_image_url
  if (body.video_url !== undefined) update.videoUrl = body.video_url
  if (body.tags !== undefined) update.tags = body.tags
  if (body.status !== undefined) update.status = body.status as 'draft' | 'review' | 'scheduled' | 'published'
  if (body.meta_title !== undefined) update.metaTitle = body.meta_title
  if (body.meta_description !== undefined) update.metaDescription = body.meta_description
  if (body.og_image_url !== undefined) update.ogImageUrl = body.og_image_url
  if (body.scheduled_at !== undefined) update.scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : null

  if (typeof body.slug === 'string' && body.slug.trim()) {
    update.slug = await ensureUniqueSlug(db, body.slug.trim(), id)
  }

  if (body.status === 'published' && existing.status !== 'published') {
    update.publishedAt = new Date()
  }

  if (body.content !== undefined) {
    update.wordCount = computeWordCount(body.content)
    update.readingTimeMin = computeReadingTime(update.wordCount)
  }

  update.lastSavedBy = userId

  const shouldRevision =
    options.createRevision ||
    body.status === 'published' ||
    (!options.autosave && body.content !== undefined)
  if (shouldRevision) {
    const revTitle = (body.title ?? existing.title) as string
    const revExcerpt = (body.excerpt !== undefined ? body.excerpt : existing.excerpt) as string | null
    const revContent = body.content ?? existing.content
    const { version: newVersion } = await createRevision(id, revContent, revTitle, revExcerpt, userId)
    update.version = newVersion
  }

  const [row] = await db
    .update(articles)
    .set(update as Record<string, unknown>)
    .where(eq(articles.id, id))
    .returning()
  return row ? toArticle(row) : null
}

/* ---------- Delete ---------- */

export async function deleteArticle(id: string, role: AppRole): Promise<boolean> {
  if (!['manager', 'admin'].includes(role)) return false
  if (!config.database) return false
  const db = getDb()
  const [deleted] = await db.delete(articles).where(eq(articles.id, id)).returning({ id: articles.id })
  return !!deleted
}
