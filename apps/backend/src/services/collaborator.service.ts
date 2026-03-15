/**
 * Article collaborator service — manage who can co-edit an article.
 * Collaborators can edit an article they don't own (but not simultaneously — locks apply).
 */
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { articleCollaborators, articles, profiles } from '../db/schema.js'
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

function toCollaborator(row: typeof articleCollaborators.$inferSelect & { userEmail?: string | null }): Collaborator {
  return {
    id: row.id,
    article_id: row.articleId,
    user_id: row.userId,
    role: row.role as CollabRole,
    added_by: row.addedBy,
    created_at: row.createdAt.toISOString(),
    user: row.userEmail != null ? { email: row.userEmail } : null,
  }
}

/** Add a collaborator. Returns the collaborator or null if already exists. */
export async function addCollaborator(
  articleId: string,
  userId: string,
  role: CollabRole,
  addedBy: string,
): Promise<Collaborator | null> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  try {
    const [row] = await db
      .insert(articleCollaborators)
      .values({ articleId, userId, role, addedBy })
      .onConflictDoUpdate({
        target: [articleCollaborators.articleId, articleCollaborators.userId],
        set: { role, addedBy },
      })
      .returning()
    if (!row) return null
    const [withUser] = await db
      .select({
        id: articleCollaborators.id,
        articleId: articleCollaborators.articleId,
        userId: articleCollaborators.userId,
        role: articleCollaborators.role,
        addedBy: articleCollaborators.addedBy,
        createdAt: articleCollaborators.createdAt,
        userEmail: profiles.email,
      })
      .from(articleCollaborators)
      .leftJoin(profiles, eq(articleCollaborators.userId, profiles.id))
      .where(and(eq(articleCollaborators.articleId, articleId), eq(articleCollaborators.userId, userId)))
      .limit(1)
    return toCollaborator(withUser ?? { ...row, userEmail: null })
  } catch {
    return null
  }
}

/** Remove a collaborator. */
export async function removeCollaborator(articleId: string, userId: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [deleted] = await db
    .delete(articleCollaborators)
    .where(and(eq(articleCollaborators.articleId, articleId), eq(articleCollaborators.userId, userId)))
    .returning({ id: articleCollaborators.id })
  return !!deleted
}

/** List collaborators for an article. */
export async function listCollaborators(articleId: string): Promise<Collaborator[]> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select({
      id: articleCollaborators.id,
      articleId: articleCollaborators.articleId,
      userId: articleCollaborators.userId,
      role: articleCollaborators.role,
      addedBy: articleCollaborators.addedBy,
      createdAt: articleCollaborators.createdAt,
      userEmail: profiles.email,
    })
    .from(articleCollaborators)
    .leftJoin(profiles, eq(articleCollaborators.userId, profiles.id))
    .where(eq(articleCollaborators.articleId, articleId))
    .orderBy(articleCollaborators.createdAt)
  return rows.map(toCollaborator)
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
  if (['editor', 'manager', 'admin'].includes(userRole)) return true

  if (!config.database) return false
  const db = getDb()

  const [article] = await db
    .select({ authorId: articles.authorId })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  if (article?.authorId === userId) return true

  const [collab] = await db
    .select({ id: articleCollaborators.id })
    .from(articleCollaborators)
    .where(and(eq(articleCollaborators.articleId, articleId), eq(articleCollaborators.userId, userId)))
    .limit(1)
  return !!collab
}

/** Find a user profile by email. Returns profile id or null. */
export async function findProfileByEmail(email: string): Promise<string | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1)
  return row?.id ?? null
}
