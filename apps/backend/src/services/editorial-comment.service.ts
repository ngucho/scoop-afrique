/**
 * Editorial comment service — staff feedback on articles during editing/review.
 * These are NOT reader-facing comments; they are internal to the newsroom.
 */
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { editorialComments, profiles } from '../db/schema.js'
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

function toEditorialComment(row: typeof editorialComments.$inferSelect & { authorEmail?: string | null }): EditorialComment {
  return {
    id: row.id,
    article_id: row.articleId,
    author_id: row.authorId,
    body: row.body,
    resolved: row.resolved,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    author: row.authorEmail != null ? { email: row.authorEmail } : null,
  }
}

/** Add an editorial comment to an article. */
export async function addEditorialComment(
  articleId: string,
  authorId: string,
  body: string,
): Promise<EditorialComment> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const [row] = await db
    .insert(editorialComments)
    .values({ articleId, authorId, body })
    .returning()
  if (!row) throw new Error('Failed to create editorial comment')
  const [withAuthor] = await db
    .select({
      id: editorialComments.id,
      articleId: editorialComments.articleId,
      authorId: editorialComments.authorId,
      body: editorialComments.body,
      resolved: editorialComments.resolved,
      createdAt: editorialComments.createdAt,
      updatedAt: editorialComments.updatedAt,
      authorEmail: profiles.email,
    })
    .from(editorialComments)
    .leftJoin(profiles, eq(editorialComments.authorId, profiles.id))
    .where(eq(editorialComments.id, row.id))
    .limit(1)
  return toEditorialComment(withAuthor ?? { ...row, authorEmail: null })
}

/** List editorial comments for an article. */
export async function listEditorialComments(
  articleId: string,
  includeResolved = false,
): Promise<EditorialComment[]> {
  if (!config.database) return []
  const db = getDb()
  const conditions = includeResolved
    ? eq(editorialComments.articleId, articleId)
    : and(eq(editorialComments.articleId, articleId), eq(editorialComments.resolved, false))
  const rows = await db
    .select({
      id: editorialComments.id,
      articleId: editorialComments.articleId,
      authorId: editorialComments.authorId,
      body: editorialComments.body,
      resolved: editorialComments.resolved,
      createdAt: editorialComments.createdAt,
      updatedAt: editorialComments.updatedAt,
      authorEmail: profiles.email,
    })
    .from(editorialComments)
    .leftJoin(profiles, eq(editorialComments.authorId, profiles.id))
    .where(conditions)
    .orderBy(editorialComments.createdAt)
  return rows.map(toEditorialComment)
}

/** Mark a comment as resolved. */
export async function resolveEditorialComment(commentId: string): Promise<EditorialComment | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .update(editorialComments)
    .set({ resolved: true })
    .where(eq(editorialComments.id, commentId))
    .returning()
  if (!row) return null
  const [withAuthor] = await db
    .select({
      id: editorialComments.id,
      articleId: editorialComments.articleId,
      authorId: editorialComments.authorId,
      body: editorialComments.body,
      resolved: editorialComments.resolved,
      createdAt: editorialComments.createdAt,
      updatedAt: editorialComments.updatedAt,
      authorEmail: profiles.email,
    })
    .from(editorialComments)
    .leftJoin(profiles, eq(editorialComments.authorId, profiles.id))
    .where(eq(editorialComments.id, commentId))
    .limit(1)
  return toEditorialComment(withAuthor ?? { ...row, authorEmail: null })
}

/** Delete an editorial comment. Only author or editor+ can delete. */
export async function deleteEditorialComment(
  commentId: string,
  userId: string,
  userRole: string,
): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()

  if (['editor', 'manager', 'admin'].includes(userRole)) {
    const [deleted] = await db.delete(editorialComments).where(eq(editorialComments.id, commentId)).returning({ id: editorialComments.id })
    return !!deleted
  }

  const [existing] = await db.select({ authorId: editorialComments.authorId }).from(editorialComments).where(eq(editorialComments.id, commentId)).limit(1)
  if (!existing || existing.authorId !== userId) return false

  const [deleted] = await db.delete(editorialComments).where(eq(editorialComments.id, commentId)).returning({ id: editorialComments.id })
  return !!deleted
}

/** Count unresolved editorial comments for an article. */
export async function countUnresolved(articleId: string): Promise<number> {
  if (!config.database) return 0
  const db = getDb()
  const rows = await db
    .select()
    .from(editorialComments)
    .where(and(eq(editorialComments.articleId, articleId), eq(editorialComments.resolved, false)))
  return rows.length
}
