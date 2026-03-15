/**
 * Comment service — CRUD + moderation for article comments.
 * Comments are created in "pending" status and must be approved by staff.
 * Supports nested replies via parent_id.
 */
import { eq, and, desc, asc, count } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { comments, profiles } from '../db/schema.js'
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

function toComment(row: typeof comments.$inferSelect): Comment {
  return {
    id: row.id,
    article_id: row.articleId,
    user_id: row.userId ?? '',
    parent_id: row.parentId,
    body: row.body,
    status: row.status as CommentStatus,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function toCommentWithAuthor(row: typeof comments.$inferSelect & { authorEmail?: string | null }): CommentWithAuthor {
  return {
    ...toComment(row),
    author: row.authorEmail != null ? { email: row.authorEmail } : null,
  }
}

/* ---------- List approved comments for an article ---------- */

export async function listArticleComments(
  articleId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ data: CommentWithAuthor[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(options.limit ?? 50, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const [countRow] = await db
    .select({ count: count() })
    .from(comments)
    .where(and(eq(comments.articleId, articleId), eq(comments.status, 'approved')))
  const total = countRow?.count ?? 0

  const rows = await db
    .select({
      id: comments.id,
      articleId: comments.articleId,
      userId: comments.userId,
      parentId: comments.parentId,
      body: comments.body,
      status: comments.status,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorEmail: profiles.email,
    })
    .from(comments)
    .leftJoin(profiles, eq(comments.userId, profiles.id))
    .where(and(eq(comments.articleId, articleId), eq(comments.status, 'approved')))
    .orderBy(asc(comments.createdAt))
    .limit(limit)
    .offset(offset)

  const data = rows.map((r) =>
    toCommentWithAuthor({
      ...r,
      authorEmail: r.authorEmail,
    })
  )
  return { data, total }
}

/* ---------- Create comment (pending) ---------- */

export async function createComment(
  articleId: string,
  userId: string,
  body: string,
  parentId: string | null = null
): Promise<Comment> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const [row] = await db
    .insert(comments)
    .values({
      articleId,
      userId,
      body,
      parentId: parentId ?? null,
      status: 'pending',
    })
    .returning()
  if (!row) throw new Error('Failed to create comment')
  return toComment(row)
}

/* ---------- Edit own comment ---------- */

export async function updateComment(
  commentId: string,
  userId: string,
  body: string
): Promise<Comment | null> {
  if (!config.database) return null
  const db = getDb()
  const [existing] = await db.select({ userId: comments.userId }).from(comments).where(eq(comments.id, commentId)).limit(1)
  if (!existing || existing.userId !== userId) return null

  const [row] = await db
    .update(comments)
    .set({ body, status: 'pending' })
    .where(eq(comments.id, commentId))
    .returning()
  return row ? toComment(row) : null
}

/* ---------- Delete own comment ---------- */

export async function deleteComment(
  commentId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()

  if (['admin', 'manager'].includes(userRole)) {
    const [deleted] = await db.delete(comments).where(eq(comments.id, commentId)).returning({ id: comments.id })
    return !!deleted
  }

  const [existing] = await db.select({ userId: comments.userId }).from(comments).where(eq(comments.id, commentId)).limit(1)
  if (!existing || existing.userId !== userId) return false

  const [deleted] = await db.delete(comments).where(eq(comments.id, commentId)).returning({ id: comments.id })
  return !!deleted
}

/* ---------- Admin: list all comments (any status) ---------- */

export async function listAllComments(options: {
  status?: CommentStatus
  page?: number
  limit?: number
}): Promise<{ data: CommentWithAuthor[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(options.limit ?? 50, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const countQuery = db.select({ count: count() }).from(comments)
  const [countRow] = options.status
    ? await countQuery.where(eq(comments.status, options.status))
    : await countQuery
  const total = countRow?.count ?? 0

  const baseQuery = db
    .select({
      id: comments.id,
      articleId: comments.articleId,
      userId: comments.userId,
      parentId: comments.parentId,
      body: comments.body,
      status: comments.status,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorEmail: profiles.email,
    })
    .from(comments)
    .leftJoin(profiles, eq(comments.userId, profiles.id))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset)

  const rows = options.status
    ? await baseQuery.where(eq(comments.status, options.status))
    : await baseQuery

  const data = rows.map((r) =>
    toCommentWithAuthor({
      ...r,
      authorEmail: r.authorEmail,
    })
  )
  return { data, total }
}

/* ---------- Admin: moderate comment ---------- */

export async function moderateComment(
  commentId: string,
  status: CommentStatus
): Promise<Comment | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .update(comments)
    .set({ status })
    .where(eq(comments.id, commentId))
    .returning()
  return row ? toComment(row) : null
}
