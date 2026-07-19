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
import { eq, and, desc, sql, or, ilike, isNotNull, inArray } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { articles, articleAudioJobs, articleViewEvents, categories, profiles, readerArticleHistory, readerPublicProfiles } from '../db/schema.js'
import { config } from '../config/env.js'
import type { CreateArticleBody, UpdateArticleBody } from '../schemas/article.js'
import type { AppRole } from './profile.service.js'
import { createRevision } from './revision.service.js'
import { canEditArticle } from './collaborator.service.js'
import { scoreFuzzySearch } from '../lib/fuzzy-search.js'
import { getYoutubeThumbnailUrl } from '../lib/youtube-thumbnail.js'

/* ---------- Types ---------- */

export type ArticleStatus = 'draft' | 'review' | 'scheduled' | 'published'

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  cover_image_credit: string | null
  cover_image_source: string | null
  video_url: string | null
  cover_video_credit: string | null
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
  audio_url?: string | null
  audio_storage_path?: string | null
  audio_duration_sec?: number | null
  audio_generated_at?: string | null
  audio_last_accessed_at?: string | null
  audio_expires_at?: string | null
  audio_voice?: string | null
  audio_text_hash?: string | null
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
  /** From reader_public_profiles; stripped in admin JSON; used for public author fallback. */
  reader_public_display_name?: string | null
}

export type PublicArticleCard = Omit<ArticleWithAuthor, 'content' | 'last_saved_by'>

export interface PublicAuthorProfile {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  article_count: number
}

/** Published rows for sitemap (minimal fields, no drafts). */
export interface SitemapArticleEntry {
  slug: string
  published_at: string | null
  updated_at: string
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

export interface ArticleFeedCursor {
  published_at: string
  id: string
}

export function encodeArticleFeedCursor(cursor: ArticleFeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeArticleFeedCursor(raw: string | null | undefined): ArticleFeedCursor | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<ArticleFeedCursor>
    if (typeof parsed.id !== 'string' || typeof parsed.published_at !== 'string') return null
    if (Number.isNaN(Date.parse(parsed.published_at))) return null
    return { id: parsed.id, published_at: parsed.published_at }
  } catch {
    return null
  }
}

export function canCreateArticleWithStatus(
  role: AppRole,
  status: CreateArticleBody['status'],
): boolean {
  if (status !== 'published') return true
  return role === 'editor' || role === 'manager' || role === 'admin'
}

export class ArticleReadinessError extends Error {
  readonly code = 'ARTICLE_READINESS_MISSING'
  readonly missing: string[]

  constructor(missing: string[]) {
    super(`Article incomplet: ${missing.join(', ')}`)
    this.missing = missing
  }
}

/* ---------- Helpers ---------- */

function displayNameFromEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') return null
  const local = email.split('@')[0]?.trim()
  if (!local) return null
  const words = local.replace(/[._-]+/g, ' ').trim()
  if (!words) return null
  return words.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Public JSON: OG image falls back to cover; author line uses article field, then reader profile, then email-derived label.
 */
export function presentArticleForPublicApi(article: ArticleWithAuthor): ArticleWithAuthor {
  const mergedName =
    article.author_display_name?.trim() ||
    article.reader_public_display_name?.trim() ||
    displayNameFromEmail(article.author?.email ?? null)
  const videoThumbnailUrl = getYoutubeThumbnailUrl(article.video_url)
  const { reader_public_display_name: _r, ...rest } = article
  const hasFreshAudio = isArticleAudioFresh(article)
  return {
    ...rest,
    audio_url: hasFreshAudio ? article.audio_url ?? null : null,
    audio_storage_path: hasFreshAudio ? article.audio_storage_path ?? null : null,
    og_image_url: article.og_image_url ?? article.cover_image_url ?? videoThumbnailUrl,
    author_display_name: mergedName?.trim() || null,
  }
}

export function presentArticleCardForPublicApi(article: PublicArticleCard): PublicArticleCard {
  const mergedName =
    article.author_display_name?.trim() ||
    article.reader_public_display_name?.trim() ||
    displayNameFromEmail(article.author?.email ?? null)
  const videoThumbnailUrl = getYoutubeThumbnailUrl(article.video_url)
  const { reader_public_display_name: _r, ...rest } = article
  const hasFreshAudio = isArticleAudioFresh(article)
  return {
    ...rest,
    audio_url: hasFreshAudio ? article.audio_url ?? null : null,
    audio_storage_path: hasFreshAudio ? article.audio_storage_path ?? null : null,
    cover_image_url: article.cover_image_url ?? videoThumbnailUrl,
    og_image_url: article.og_image_url ?? article.cover_image_url ?? videoThumbnailUrl,
    author_display_name: mergedName?.trim() || null,
  }
}

export function isArticleAudioFresh(article: Pick<Article, 'audio_url' | 'audio_expires_at'>): boolean {
  if (!article.audio_url) return false
  if (!article.audio_expires_at) return true
  return Date.parse(article.audio_expires_at) > Date.now()
}

/** Default byline when Writer API omits author_display_name. */
export async function getDefaultAuthorDisplayForProfile(profileId: string): Promise<string | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .select({
      email: profiles.email,
      displayName: readerPublicProfiles.displayName,
    })
    .from(profiles)
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .where(eq(profiles.id, profileId))
    .limit(1)
  if (!row) return null
  const dn = row.displayName?.trim()
  if (dn) return dn
  return displayNameFromEmail(row.email)
}

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

function hasUsableText(value: string | null | undefined, minLength: number): boolean {
  return (value ?? '').trim().length >= minLength
}

function isValidYoutubeUrl(value: string | null | undefined): boolean {
  const url = (value ?? '').trim()
  if (!url) return true
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url)
}

function getArticleReadinessMissing(input: {
  title: string | null | undefined
  excerpt: string | null | undefined
  categoryId: string | null | undefined
  content: unknown
  coverImageUrl: string | null | undefined
  videoUrl: string | null | undefined
  metaTitle: string | null | undefined
  metaDescription: string | null | undefined
}): string[] {
  const wordCount = computeWordCount(input.content)
  const missing: string[] = []
  if (!hasUsableText(input.title, 10)) missing.push('titre d’au moins 10 caractères')
  if (!hasUsableText(input.excerpt, 20)) missing.push('chapeau d’au moins 20 caractères')
  if (!input.categoryId) missing.push('rubrique')
  if (wordCount < 200) missing.push('corps d’article d’au moins 200 mots')
  if (!input.coverImageUrl && !input.videoUrl) missing.push('image de couverture ou vidéo YouTube')
  if (!isValidYoutubeUrl(input.videoUrl)) missing.push('lien vidéo YouTube valide')
  if (!input.metaTitle && !input.metaDescription) missing.push('meta titre ou meta description')
  return missing
}

function assertArticleReadyForSubmission(input: Parameters<typeof getArticleReadinessMissing>[0]) {
  const missing = getArticleReadinessMissing(input)
  if (missing.length > 0) throw new ArticleReadinessError(missing)
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
    cover_image_credit: r.coverImageCredit ?? null,
    cover_image_source: r.coverImageSource ?? null,
    video_url: r.videoUrl,
    cover_video_credit: r.coverVideoCredit ?? null,
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
    audio_url: r.audioUrl ?? null,
    audio_storage_path: r.audioStoragePath ?? null,
    audio_duration_sec: r.audioDurationSec ?? null,
    audio_generated_at: r.audioGeneratedAt?.toISOString() ?? null,
    audio_last_accessed_at: r.audioLastAccessedAt?.toISOString() ?? null,
    audio_expires_at: r.audioExpiresAt?.toISOString() ?? null,
    audio_voice: r.audioVoice ?? null,
    audio_text_hash: r.audioTextHash ?? null,
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
    readerPublicDisplayName?: string | null
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
    reader_public_display_name: r.readerPublicDisplayName?.trim() || null,
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

function toPublicArticleCard(row: Record<string, unknown>): PublicArticleCard {
  const full = toArticleWithAuthor(row)
  const { content: _content, last_saved_by: _lastSavedBy, ...card } = full
  return card
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
      coverImageCredit: articles.coverImageCredit,
      coverImageSource: articles.coverImageSource,
      videoUrl: articles.videoUrl,
      coverVideoCredit: articles.coverVideoCredit,
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
      audioUrl: articles.audioUrl,
      audioStoragePath: articles.audioStoragePath,
      audioDurationSec: articles.audioDurationSec,
      audioGeneratedAt: articles.audioGeneratedAt,
      audioLastAccessedAt: articles.audioLastAccessedAt,
      audioExpiresAt: articles.audioExpiresAt,
      audioVoice: articles.audioVoice,
      audioTextHash: articles.audioTextHash,
      viewCount: articles.viewCount,
      wordCount: articles.wordCount,
      readingTimeMin: articles.readingTimeMin,
      version: articles.version,
      lastSavedBy: articles.lastSavedBy,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorEmail: profiles.email,
      readerPublicDisplayName: readerPublicProfiles.displayName,
      catId: categories.id,
      catName: categories.name,
      catSlug: categories.slug,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
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

export async function listPublicArticleCards(
  options: Pick<ListOptions, 'category' | 'q' | 'page' | 'limit' | 'tag' | 'authorId'>
): Promise<{ data: PublicArticleCard[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(options.limit ?? 20, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const conditions = [eq(articles.status, 'published'), isNotNull(articles.publishedAt)]

  if (options.category) {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, options.category)).limit(1)
    if (!cat) return { data: [], total: 0 }
    conditions.push(eq(articles.categoryId, cat.id))
  }

  if (options.tag) {
    conditions.push(sql`${options.tag} = ANY(${articles.tags})`)
  }

  if (options.authorId) {
    conditions.push(eq(articles.authorId, options.authorId))
  }

  const whereClause = and(...conditions)

  if (options.q) {
    const maxCandidates = 1500
    const rows = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        excerpt: articles.excerpt,
        coverImageUrl: articles.coverImageUrl,
        coverImageCredit: articles.coverImageCredit,
        coverImageSource: articles.coverImageSource,
        videoUrl: articles.videoUrl,
        coverVideoCredit: articles.coverVideoCredit,
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
        audioUrl: articles.audioUrl,
        audioStoragePath: articles.audioStoragePath,
        audioDurationSec: articles.audioDurationSec,
        audioGeneratedAt: articles.audioGeneratedAt,
        audioLastAccessedAt: articles.audioLastAccessedAt,
        audioExpiresAt: articles.audioExpiresAt,
        audioVoice: articles.audioVoice,
        audioTextHash: articles.audioTextHash,
        viewCount: articles.viewCount,
        wordCount: articles.wordCount,
        readingTimeMin: articles.readingTimeMin,
        version: articles.version,
        lastSavedBy: articles.lastSavedBy,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        authorEmail: profiles.email,
        readerPublicDisplayName: readerPublicProfiles.displayName,
        catId: categories.id,
        catName: categories.name,
        catSlug: categories.slug,
      })
      .from(articles)
      .leftJoin(profiles, eq(articles.authorId, profiles.id))
      .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(articles.publishedAt))
      .limit(maxCandidates)

    const cards = rows.map((r) =>
      toPublicArticleCard({
        ...r,
        categoryId: r.catId ?? undefined,
        categoryName: r.catName ?? undefined,
        categorySlug: r.catSlug ?? undefined,
      })
    )
    const scored = scoreFuzzySearch(options.q, cards.map((card) => ({
      item: card,
      fields: [
        { value: card.title, weight: 4 },
        { value: card.excerpt, weight: 2 },
        { value: card.tags.join(' '), weight: 2 },
        { value: card.category?.name, weight: 2 },
        { value: card.author_display_name, weight: 1 },
      ],
    })))
    const paged = scored.slice(offset, offset + limit).map((result) => result.item)
    return { data: paged, total: scored.length }
  }

  const [countRow, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(whereClause),
    db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        excerpt: articles.excerpt,
        coverImageUrl: articles.coverImageUrl,
        coverImageCredit: articles.coverImageCredit,
        coverImageSource: articles.coverImageSource,
        videoUrl: articles.videoUrl,
        coverVideoCredit: articles.coverVideoCredit,
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
        audioUrl: articles.audioUrl,
        audioStoragePath: articles.audioStoragePath,
        audioDurationSec: articles.audioDurationSec,
        audioGeneratedAt: articles.audioGeneratedAt,
        audioLastAccessedAt: articles.audioLastAccessedAt,
        audioExpiresAt: articles.audioExpiresAt,
        audioVoice: articles.audioVoice,
        audioTextHash: articles.audioTextHash,
        viewCount: articles.viewCount,
        wordCount: articles.wordCount,
        readingTimeMin: articles.readingTimeMin,
        version: articles.version,
        lastSavedBy: articles.lastSavedBy,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        authorEmail: profiles.email,
        readerPublicDisplayName: readerPublicProfiles.displayName,
        catId: categories.id,
        catName: categories.name,
        catSlug: categories.slug,
      })
      .from(articles)
      .leftJoin(profiles, eq(articles.authorId, profiles.id))
      .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset),
  ])

  const data = rows.map((r) =>
    toPublicArticleCard({
      ...r,
      categoryId: r.catId ?? undefined,
      categoryName: r.catName ?? undefined,
      categorySlug: r.catSlug ?? undefined,
    })
  )
  return { data, total: countRow[0]?.count ?? 0 }
}

export async function getPublicAuthorProfile(authorId: string): Promise<PublicAuthorProfile | null> {
  if (!config.database) return null
  const db = getDb()

  const [row] = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      journalistPublicBio: profiles.journalistPublicBio,
      journalistPublicAvatarUrl: profiles.journalistPublicAvatarUrl,
      readerPublicDisplayName: readerPublicProfiles.displayName,
      readerPublicBio: readerPublicProfiles.bio,
      readerPublicAvatarUrl: readerPublicProfiles.avatarUrl,
      articleCount: sql<number>`count(${articles.id})::int`,
    })
    .from(profiles)
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .leftJoin(
      articles,
      and(
        eq(articles.authorId, profiles.id),
        eq(articles.status, 'published'),
        isNotNull(articles.publishedAt),
      ),
    )
    .where(eq(profiles.id, authorId))
    .groupBy(
      profiles.id,
      profiles.email,
      profiles.journalistPublicBio,
      profiles.journalistPublicAvatarUrl,
      readerPublicProfiles.displayName,
      readerPublicProfiles.bio,
      readerPublicProfiles.avatarUrl,
    )
    .limit(1)

  if (!row) return null
  const displayName = row.readerPublicDisplayName?.trim() || displayNameFromEmail(row.email) || 'Journaliste Scoop'
  const bio = row.journalistPublicBio?.trim() || row.readerPublicBio?.trim() || null
  const avatarUrl = row.journalistPublicAvatarUrl?.trim() || row.readerPublicAvatarUrl?.trim() || null
  return {
    id: row.id,
    display_name: displayName,
    bio,
    avatar_url: avatarUrl,
    article_count: row.articleCount ?? 0,
  }
}

function tokenizeForRecommendation(value: string | null | undefined): Set<string> {
  const stop = new Set(['avec', 'dans', 'des', 'les', 'une', 'pour', 'sur', 'aux', 'qui', 'que', 'par', 'est', 'sont'])
  return new Set(
    (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stop.has(w)),
  )
}

function overlapScore(a: Set<string>, b: Set<string>, weight: number, max: number): number {
  if (a.size === 0 || b.size === 0) return 0
  let hits = 0
  for (const token of a) {
    if (b.has(token)) hits += 1
  }
  return Math.min(max, hits * weight)
}

export async function getRecommendedArticleForReader(
  currentIdOrSlug: string,
  historyIds: string[] = [],
): Promise<PublicArticleCard | null> {
  if (!config.database) return null
  const current = await getArticleByIdOrSlug(currentIdOrSlug, true)
  if (!current) return null

  const [{ data: candidates }, historyCards] = await Promise.all([
    listPublicArticleCards({ page: 1, limit: 120 }),
    listPublishedArticleCardsByIds(historyIds.slice(0, 25)),
  ])

  const currentTokens = tokenizeForRecommendation(
    [current.title, current.excerpt, extractText(current.content), current.tags.join(' ')].filter(Boolean).join(' '),
  )
  const currentTags = new Set((current.tags ?? []).map((t) => t.toLowerCase()))
  const historyCategoryIds = new Set(historyCards.map((a) => a.category_id).filter(Boolean))
  const historyTags = new Set(historyCards.flatMap((a) => a.tags ?? []).map((t) => t.toLowerCase()))
  const readIds = new Set(historyIds)

  const scored = candidates
    .filter((candidate) => candidate.id !== current.id)
    .map((candidate) => {
      const candidateTokens = tokenizeForRecommendation(
        [candidate.title, candidate.excerpt, candidate.tags.join(' ')].filter(Boolean).join(' '),
      )
      const candidateTags = new Set((candidate.tags ?? []).map((t) => t.toLowerCase()))
      let score = 0
      if (candidate.category_id && candidate.category_id === current.category_id) score += 36
      if (candidate.author_id === current.author_id) score += 8
      score += overlapScore(currentTags, candidateTags, 12, 36)
      score += overlapScore(currentTokens, candidateTokens, 3, 24)
      if (candidate.category_id && historyCategoryIds.has(candidate.category_id)) score += 10
      score += overlapScore(historyTags, candidateTags, 5, 20)
      score += Math.min(12, Math.log10(10 + (candidate.view_count ?? 0)) * 5)
      if (readIds.has(candidate.id)) score -= 35
      return { candidate, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored[0]?.candidate ? presentArticleCardForPublicApi(scored[0].candidate) : null
}

export async function recordReaderArticleHistory(profileId: string, articleId: string): Promise<void> {
  if (!config.database) return
  const db = getDb()
  await db
    .insert(readerArticleHistory)
    .values({ profileId, articleId, viewedAt: new Date() })
    .onConflictDoUpdate({
      target: [readerArticleHistory.profileId, readerArticleHistory.articleId],
      set: { viewedAt: new Date() },
    })
}

export async function listReaderArticleHistoryIds(profileId: string, limit = 30): Promise<string[]> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select({ articleId: readerArticleHistory.articleId })
    .from(readerArticleHistory)
    .where(eq(readerArticleHistory.profileId, profileId))
    .orderBy(desc(readerArticleHistory.viewedAt))
    .limit(Math.min(Math.max(limit, 1), 100))
  return rows.map((row) => row.articleId)
}

export async function enqueueArticleAudioJob(
  articleId: string,
  reason: 'published' | 'content_updated' | 'manual' = 'published',
): Promise<void> {
  if (!config.database) return
  const db = getDb()
  await db
    .insert(articleAudioJobs)
    .values({
      articleId,
      reason,
      status: 'queued',
      attempts: 0,
      lastError: null,
      lockedAt: null,
      startedAt: null,
      finishedAt: null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: articleAudioJobs.articleId,
      set: {
        reason,
        status: sql`CASE
          WHEN ${articleAudioJobs.status} IN ('queued', 'processing') THEN ${articleAudioJobs.status}
          ELSE 'queued'::article_audio_job_status
        END`,
        attempts: sql`CASE
          WHEN ${articleAudioJobs.status} IN ('queued', 'processing') THEN ${articleAudioJobs.attempts}
          ELSE 0
        END`,
        lastError: sql`CASE
          WHEN ${articleAudioJobs.status} IN ('queued', 'processing') THEN ${articleAudioJobs.lastError}
          ELSE NULL
        END`,
        lockedAt: sql`CASE
          WHEN ${articleAudioJobs.status} IN ('queued', 'processing') THEN ${articleAudioJobs.lockedAt}
          ELSE NULL
        END`,
        startedAt: sql`CASE
          WHEN ${articleAudioJobs.status} IN ('queued', 'processing') THEN ${articleAudioJobs.startedAt}
          ELSE NULL
        END`,
        finishedAt: sql`CASE
          WHEN ${articleAudioJobs.status} IN ('queued', 'processing') THEN ${articleAudioJobs.finishedAt}
          ELSE NULL
        END`,
        updatedAt: new Date(),
      },
    })
}

async function triggerArticleAudioWorker(articleId?: string): Promise<void> {
  if (!config.ttsWorker) {
    console.warn(`[article-audio] worker trigger skipped article=${articleId ?? 'none'} reason=missing_tts_worker_config`)
    return
  }
  try {
    const response = await fetch(`${config.ttsWorker.url}/process-one`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.ttsWorker.secret ? { Authorization: `Bearer ${config.ttsWorker.secret}` } : {}),
      },
      body: JSON.stringify(articleId ? { article_id: articleId } : {}),
      signal: AbortSignal.timeout(15000),
    }) as unknown as { ok: boolean; status: number }
    console.info(`[article-audio] worker trigger article=${articleId ?? 'none'} status=${response.status}`)
    if (!response.ok) {
      console.warn(`[article-audio] worker trigger failed status=${response.status}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[article-audio] worker trigger failed article=${articleId ?? 'none'}: ${message}`)
  }
}

export async function markArticleAudioAccess(
  articleId: string,
): Promise<{ available: boolean; audio_url: string | null }> {
  if (!config.database) return { available: false, audio_url: null }
  const db = getDb()
  const [article] = await db
    .select({
      id: articles.id,
      audioUrl: articles.audioUrl,
      audioExpiresAt: articles.audioExpiresAt,
      status: articles.status,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)

  if (!article || article.status !== 'published' || !article.publishedAt) {
    return { available: false, audio_url: null }
  }

  const fresh =
    Boolean(article.audioUrl) &&
    (!article.audioExpiresAt || article.audioExpiresAt.getTime() > Date.now())

  if (!fresh) {
    await enqueueArticleAudioJob(article.id, 'manual')
    console.info(`[article-audio] access queued article=${article.id}`)
    await triggerArticleAudioWorker(article.id)
    return { available: false, audio_url: null }
  }

  const expiresAt = new Date(Date.now() + 5 * 86400000)
  await db
    .update(articles)
    .set({
      audioLastAccessedAt: new Date(),
      audioExpiresAt: expiresAt,
    })
    .where(eq(articles.id, article.id))

  return { available: true, audio_url: article.audioUrl }
}

export async function listPublicArticleCardsCursor(options: {
  category?: string
  q?: string
  tag?: string
  cursor?: string | null
  limit?: number
}): Promise<{ data: PublicArticleCard[]; next_cursor: string | null }> {
  if (!config.database) return { data: [], next_cursor: null }
  const db = getDb()
  const limit = Math.min(options.limit ?? 20, 100)
  const cursor = decodeArticleFeedCursor(options.cursor)

  const conditions = [eq(articles.status, 'published'), isNotNull(articles.publishedAt)]

  if (options.category) {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, options.category)).limit(1)
    if (!cat) return { data: [], next_cursor: null }
    conditions.push(eq(articles.categoryId, cat.id))
  }

  if (options.tag) {
    conditions.push(sql`${options.tag} = ANY(${articles.tags})`)
  }

  if (options.q) {
    conditions.push(or(ilike(articles.title, `%${options.q}%`), ilike(articles.excerpt, `%${options.q}%`))!)
  }

  if (cursor) {
    conditions.push(sql`(${articles.publishedAt}, ${articles.id}) < (${new Date(cursor.published_at)}, ${cursor.id}::uuid)`)
  }

  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      coverImageCredit: articles.coverImageCredit,
      coverImageSource: articles.coverImageSource,
      videoUrl: articles.videoUrl,
      coverVideoCredit: articles.coverVideoCredit,
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
      audioUrl: articles.audioUrl,
      audioStoragePath: articles.audioStoragePath,
      audioDurationSec: articles.audioDurationSec,
      audioGeneratedAt: articles.audioGeneratedAt,
      audioLastAccessedAt: articles.audioLastAccessedAt,
      audioExpiresAt: articles.audioExpiresAt,
      audioVoice: articles.audioVoice,
      audioTextHash: articles.audioTextHash,
      viewCount: articles.viewCount,
      wordCount: articles.wordCount,
      readingTimeMin: articles.readingTimeMin,
      version: articles.version,
      lastSavedBy: articles.lastSavedBy,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorEmail: profiles.email,
      readerPublicDisplayName: readerPublicProfiles.displayName,
      catId: categories.id,
      catName: categories.name,
      catSlug: categories.slug,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(limit + 1)

  const pageRows = rows.slice(0, limit)
  const data = pageRows.map((r) =>
    toPublicArticleCard({
      ...r,
      categoryId: r.catId ?? undefined,
      categoryName: r.catName ?? undefined,
      categorySlug: r.catSlug ?? undefined,
    })
  )

  const last = data[data.length - 1]
  return {
    data,
    next_cursor:
      rows.length > limit && last?.published_at
        ? encodeArticleFeedCursor({ id: last.id, published_at: last.published_at })
        : null,
  }
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
      coverImageCredit: articles.coverImageCredit,
      coverImageSource: articles.coverImageSource,
      videoUrl: articles.videoUrl,
      coverVideoCredit: articles.coverVideoCredit,
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
      audioUrl: articles.audioUrl,
      audioStoragePath: articles.audioStoragePath,
      audioDurationSec: articles.audioDurationSec,
      audioGeneratedAt: articles.audioGeneratedAt,
      audioLastAccessedAt: articles.audioLastAccessedAt,
      audioExpiresAt: articles.audioExpiresAt,
      audioVoice: articles.audioVoice,
      audioTextHash: articles.audioTextHash,
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
      readerPublicDisplayName: readerPublicProfiles.displayName,
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
      await db.insert(articleViewEvents).values({ articleId })
      await db
        .update(articles)
        .set({ viewCount: sql`${articles.viewCount} + 1` })
        .where(eq(articles.id, articleId))
    } catch {
      // Silently fail — view count is non-critical
    }
  }
}

/** Article IDs with the most view events in the last `days` days (published only). */
export async function listPublishedArticleIdsByRecentViewEvents(days: number, limit: number): Promise<string[]> {
  if (!config.database) return []
  const db = getDb()
  const d = Math.min(Math.max(days, 1), 90)
  const lim = Math.min(Math.max(limit, 1), 25)
  const since = new Date(Date.now() - d * 86400000).toISOString()
  const rows = await db.execute(
    sql`
    SELECT e.article_id AS "article_id"
    FROM article_view_events e
    INNER JOIN articles a ON a.id = e.article_id
    WHERE e.created_at >= ${since}
      AND a.status = 'published'
      AND a.published_at IS NOT NULL
    GROUP BY e.article_id
    ORDER BY COUNT(*)::int DESC
    LIMIT ${lim}
  `,
  )
  const list = rows as unknown as { article_id: string }[]
  return list.map((r) => r.article_id).filter(Boolean)
}

export async function listTopPublishedArticleIdsByAllTimeViews(limit: number): Promise<string[]> {
  if (!config.database) return []
  const db = getDb()
  const lim = Math.min(Math.max(limit, 1), 25)
  const rows = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.status, 'published'), isNotNull(articles.publishedAt)))
    .orderBy(desc(articles.viewCount), desc(articles.publishedAt))
    .limit(lim)
  return rows.map((r) => r.id)
}

/** For homepage hero fallback: recent view events first, then all-time view_count. */
export async function getPublishedArticlesMostReadForHero(
  days: number,
  maxCandidates: number,
): Promise<PublicArticleCard[]> {
  let ids = await listPublishedArticleIdsByRecentViewEvents(days, maxCandidates)
  if (ids.length === 0) {
    ids = await listTopPublishedArticleIdsByAllTimeViews(maxCandidates)
  }
  return listPublishedArticleCardsByIds(ids)
}

export async function listPublishedArticleCardsByIds(ids: string[]): Promise<PublicArticleCard[]> {
  if (!config.database || ids.length === 0) return []
  const db = getDb()
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      coverImageCredit: articles.coverImageCredit,
      coverImageSource: articles.coverImageSource,
      videoUrl: articles.videoUrl,
      coverVideoCredit: articles.coverVideoCredit,
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
      audioUrl: articles.audioUrl,
      audioStoragePath: articles.audioStoragePath,
      audioDurationSec: articles.audioDurationSec,
      audioGeneratedAt: articles.audioGeneratedAt,
      audioLastAccessedAt: articles.audioLastAccessedAt,
      audioExpiresAt: articles.audioExpiresAt,
      audioVoice: articles.audioVoice,
      audioTextHash: articles.audioTextHash,
      viewCount: articles.viewCount,
      wordCount: articles.wordCount,
      readingTimeMin: articles.readingTimeMin,
      version: articles.version,
      lastSavedBy: articles.lastSavedBy,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorEmail: profiles.email,
      readerPublicDisplayName: readerPublicProfiles.displayName,
      catId: categories.id,
      catName: categories.name,
      catSlug: categories.slug,
    })
    .from(articles)
    .leftJoin(profiles, eq(articles.authorId, profiles.id))
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(inArray(articles.id, ids), eq(articles.status, 'published'), isNotNull(articles.publishedAt)))

  const rank = new Map(ids.map((id, index) => [id, index]))
  return rows
    .map((r) =>
      toPublicArticleCard({
        ...r,
        categoryId: r.catId ?? undefined,
        categoryName: r.catName ?? undefined,
        categorySlug: r.catSlug ?? undefined,
      })
    )
    .sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
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
  if (body.status === 'review' || body.status === 'published') {
    assertArticleReadyForSubmission({
      title: body.title,
      excerpt: body.excerpt ?? null,
      categoryId: body.category_id ?? null,
      content: contentData,
      coverImageUrl: body.cover_image_url ?? null,
      videoUrl: body.video_url ?? null,
      metaTitle: body.meta_title ?? null,
      metaDescription: body.meta_description ?? null,
    })
  }
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
      coverImageCredit: body.cover_image_credit ?? null,
      coverImageSource: body.cover_image_source ?? null,
      videoUrl: body.video_url ?? null,
      coverVideoCredit: body.cover_video_credit ?? null,
      tags: body.tags ?? [],
      authorId,
      authorDisplayName: body.author_display_name ?? null,
      status: (body.status ?? 'draft') as 'draft' | 'review' | 'scheduled' | 'published',
      metaTitle: body.meta_title ?? null,
      metaDescription: body.meta_description ?? null,
      /** OG image follows cover; explicit og without cover still stored on create for edge cases. */
      ogImageUrl: body.cover_image_url ?? body.og_image_url ?? null,
      scheduledAt: body.scheduled_at ? new Date(body.scheduled_at) : null,
      wordCount,
      readingTimeMin: computeReadingTime(wordCount),
      version: 1,
      lastSavedBy: authorId,
    })
    .returning()

  if (!row) throw new Error('Failed to create article')
  if (row.status === 'published') {
    enqueueArticleAudioJob(row.id, 'published').catch(() => {})
  }
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
    .select({
      authorId: articles.authorId,
      status: articles.status,
      title: articles.title,
      excerpt: articles.excerpt,
      content: articles.content,
      version: articles.version,
      coverImageUrl: articles.coverImageUrl,
      videoUrl: articles.videoUrl,
      categoryId: articles.categoryId,
      metaTitle: articles.metaTitle,
      metaDescription: articles.metaDescription,
    })
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
  if (body.cover_image_credit !== undefined) update.coverImageCredit = body.cover_image_credit
  if (body.cover_image_source !== undefined) update.coverImageSource = body.cover_image_source
  if (body.video_url !== undefined) update.videoUrl = body.video_url
  if (body.cover_video_credit !== undefined) update.coverVideoCredit = body.cover_video_credit
  if (body.tags !== undefined) update.tags = body.tags
  if (body.status !== undefined) update.status = body.status as 'draft' | 'review' | 'scheduled' | 'published'
  if (body.meta_title !== undefined) update.metaTitle = body.meta_title
  if (body.meta_description !== undefined) update.metaDescription = body.meta_description
  if (body.scheduled_at !== undefined) update.scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : null

  if (typeof body.slug === 'string' && body.slug.trim()) {
    update.slug = await ensureUniqueSlug(db, body.slug.trim(), id)
  }

  if (body.status === 'published' && existing.status !== 'published') {
    update.publishedAt = new Date()
  }

  if (body.status === 'review' || body.status === 'published') {
    assertArticleReadyForSubmission({
      title: (update.title ?? existing.title) as string,
      excerpt: update.excerpt !== undefined ? update.excerpt : existing.excerpt,
      categoryId: update.categoryId !== undefined ? update.categoryId : existing.categoryId,
      content: update.content !== undefined ? update.content : existing.content,
      coverImageUrl:
        update.coverImageUrl !== undefined ? update.coverImageUrl : existing.coverImageUrl,
      videoUrl: update.videoUrl !== undefined ? update.videoUrl : existing.videoUrl,
      metaTitle: update.metaTitle !== undefined ? update.metaTitle : existing.metaTitle,
      metaDescription:
        update.metaDescription !== undefined ? update.metaDescription : existing.metaDescription,
    })
  }

  if (body.content !== undefined) {
    update.wordCount = computeWordCount(body.content)
    update.readingTimeMin = computeReadingTime(update.wordCount)
  }

  const articleTextChanged =
    body.title !== undefined ||
    body.excerpt !== undefined ||
    body.content !== undefined
  const publishedTextChanged = existing.status === 'published' && articleTextChanged
  if (publishedTextChanged) {
    update.audioUrl = null
    update.audioStoragePath = null
    update.audioDurationSec = null
    update.audioGeneratedAt = null
    update.audioLastAccessedAt = null
    update.audioExpiresAt = null
    update.audioTextHash = null
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

  const mergedCover =
    update.coverImageUrl !== undefined ? update.coverImageUrl : existing.coverImageUrl
  update.ogImageUrl = mergedCover ?? null

  const [row] = await db
    .update(articles)
    .set(update as Record<string, unknown>)
    .where(eq(articles.id, id))
    .returning()
  if (row?.status === 'published' && (body.status === 'published' || publishedTextChanged)) {
    enqueueArticleAudioJob(row.id, publishedTextChanged ? 'content_updated' : 'published').catch(() => {})
  }
  return row ? toArticle(row) : null
}

/* ---------- Sitemap (published only) ---------- */

export async function listPublishedArticleSitemapEntries(options: {
  page: number
  limit: number
}): Promise<{ data: SitemapArticleEntry[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(Math.max(options.limit, 1), 1000)
  const offset = ((options.page ?? 1) - 1) * limit
  const whereClause = and(eq(articles.status, 'published'), isNotNull(articles.publishedAt))

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .where(whereClause)
  const total = countRow?.count ?? 0

  const rows = await db
    .select({
      slug: articles.slug,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(whereClause)
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset)

  const data: SitemapArticleEntry[] = rows.map((r) => ({
    slug: r.slug,
    published_at: r.publishedAt?.toISOString() ?? null,
    updated_at: r.updatedAt.toISOString(),
  }))
  return { data, total }
}

/** Google News sitemap: articles published within last `hours` hours, with title. */
export async function listNewsArticlesForSitemap(hours = 72): Promise<
  Array<{ slug: string; title: string; published_at: string; tags: string[]; category_name: string | null }>
> {
  if (!config.database) return []
  const db = getDb()
  const since = new Date(Date.now() - hours * 3600 * 1000)
  const rows = await db
    .select({
      slug: articles.slug,
      title: articles.title,
      publishedAt: articles.publishedAt,
      tags: articles.tags,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, 'published'),
        isNotNull(articles.publishedAt),
        sql`${articles.publishedAt} >= ${since}`
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(1000)
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    published_at: r.publishedAt!.toISOString(),
    tags: r.tags ?? [],
    category_name: r.categoryName ?? null,
  }))
}

/* ---------- Delete ---------- */

export async function deleteArticle(id: string, role: AppRole): Promise<boolean> {
  if (!['manager', 'admin'].includes(role)) return false
  if (!config.database) return false
  const db = getDb()
  const [deleted] = await db.delete(articles).where(eq(articles.id, id)).returning({ id: articles.id })
  return !!deleted
}
