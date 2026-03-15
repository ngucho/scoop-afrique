/**
 * Article revision service — version history and rollback.
 * A revision is created on every manual save and on publish.
 * Only the 3 latest revisions per article are kept to save storage.
 */
import { eq, desc, lt, and } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { articleRevisions, articles, profiles } from '../db/schema.js'
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

function toRevision(row: typeof articleRevisions.$inferSelect & { authorEmail?: string | null }): ArticleRevision {
  return {
    id: row.id,
    article_id: row.articleId,
    content: row.content,
    title: row.title,
    excerpt: row.excerpt,
    version: row.version,
    created_by: row.createdBy,
    created_at: row.createdAt.toISOString(),
    author: row.authorEmail != null ? { email: row.authorEmail } : null,
  }
}

/** Create a new revision for an article. Returns the version number. */
export async function createRevision(
  articleId: string,
  content: unknown,
  title: string,
  excerpt: string | null,
  userId: string,
): Promise<{ revision: ArticleRevision; version: number }> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()

  const [latest] = await db
    .select({ version: articleRevisions.version })
    .from(articleRevisions)
    .where(eq(articleRevisions.articleId, articleId))
    .orderBy(desc(articleRevisions.version))
    .limit(1)

  const nextVersion = (latest?.version ?? 0) + 1

  const [row] = await db
    .insert(articleRevisions)
    .values({
      articleId,
      content: content as typeof articleRevisions.$inferInsert.content,
      title,
      excerpt: excerpt ?? null,
      version: nextVersion,
      createdBy: userId,
    })
    .returning()

  if (!row) throw new Error('Failed to create revision')

  await pruneRevisions(db, articleId, MAX_REVISIONS_PER_ARTICLE)

  const [withAuthor] = await db
    .select({
      id: articleRevisions.id,
      articleId: articleRevisions.articleId,
      content: articleRevisions.content,
      title: articleRevisions.title,
      excerpt: articleRevisions.excerpt,
      version: articleRevisions.version,
      createdBy: articleRevisions.createdBy,
      createdAt: articleRevisions.createdAt,
      authorEmail: profiles.email,
    })
    .from(articleRevisions)
    .leftJoin(profiles, eq(articleRevisions.createdBy, profiles.id))
    .where(eq(articleRevisions.id, row.id))
    .limit(1)

  return { revision: toRevision(withAuthor ?? { ...row, authorEmail: null }), version: nextVersion }
}

/** Keep only the latest N revisions for an article; delete older ones. */
async function pruneRevisions(
  db: ReturnType<typeof getDb>,
  articleId: string,
  keep: number,
): Promise<void> {
  const kept = await db
    .select({ version: articleRevisions.version })
    .from(articleRevisions)
    .where(eq(articleRevisions.articleId, articleId))
    .orderBy(desc(articleRevisions.version))
    .limit(keep)
  const versions = kept.map((r) => r.version)
  if (versions.length < keep) return
  const minVersionToKeep = Math.min(...versions)
  await db
    .delete(articleRevisions)
    .where(and(eq(articleRevisions.articleId, articleId), lt(articleRevisions.version, minVersionToKeep)))
}

/** List revisions for an article, newest first. */
export async function listRevisions(
  articleId: string,
  page = 1,
  limit = 20,
): Promise<{ data: ArticleRevision[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const offset = (page - 1) * limit

  const allRows = await db
    .select({
      id: articleRevisions.id,
      articleId: articleRevisions.articleId,
      content: articleRevisions.content,
      title: articleRevisions.title,
      excerpt: articleRevisions.excerpt,
      version: articleRevisions.version,
      createdBy: articleRevisions.createdBy,
      createdAt: articleRevisions.createdAt,
      authorEmail: profiles.email,
    })
    .from(articleRevisions)
    .leftJoin(profiles, eq(articleRevisions.createdBy, profiles.id))
    .where(eq(articleRevisions.articleId, articleId))
    .orderBy(desc(articleRevisions.version))
  const total = allRows.length

  const rows = allRows.slice(offset, offset + limit)
  return { data: rows.map(toRevision), total }
}

/** Get a specific revision by version number. */
export async function getRevision(
  articleId: string,
  version: number,
): Promise<ArticleRevision | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .select({
      id: articleRevisions.id,
      articleId: articleRevisions.articleId,
      content: articleRevisions.content,
      title: articleRevisions.title,
      excerpt: articleRevisions.excerpt,
      version: articleRevisions.version,
      createdBy: articleRevisions.createdBy,
      createdAt: articleRevisions.createdAt,
      authorEmail: profiles.email,
    })
    .from(articleRevisions)
    .leftJoin(profiles, eq(articleRevisions.createdBy, profiles.id))
    .where(and(eq(articleRevisions.articleId, articleId), eq(articleRevisions.version, version)))
    .limit(1)
  return row ? toRevision(row) : null
}

/** Restore an article to a specific revision. Creates a new revision as well. */
export async function restoreRevision(
  articleId: string,
  version: number,
  userId: string,
): Promise<ArticleRevision | null> {
  const rev = await getRevision(articleId, version)
  if (!rev) return null

  const { revision } = await createRevision(
    articleId,
    rev.content,
    rev.title,
    rev.excerpt,
    userId,
  )

  if (config.database) {
    const db = getDb()
    await db
      .update(articles)
      .set({
        content: rev.content as typeof articles.$inferInsert.content,
        title: rev.title,
        excerpt: rev.excerpt,
        version: revision.version,
        lastSavedBy: userId,
      })
      .where(eq(articles.id, articleId))
  }

  return revision
}
