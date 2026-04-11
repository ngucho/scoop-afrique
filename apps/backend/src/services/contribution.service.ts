/**
 * Reader contributions — community hub (analyses + event announcements).
 */
import { eq, and, desc, count } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { readerContributions, profiles } from '../db/schema.js'
import { config } from '../config/env.js'

export type ContributionKind = 'writing' | 'event'
export type ContributionStatus = 'pending' | 'approved' | 'rejected'

export interface Contribution {
  id: string
  user_id: string
  kind: ContributionKind
  title: string
  body: string
  event_location: string | null
  event_starts_at: string | null
  status: ContributionStatus
  created_at: string
  updated_at: string
}

export interface ContributionWithAuthor extends Contribution {
  author?: { email: string | null } | null
}

function toRow(row: typeof readerContributions.$inferSelect): Contribution {
  return {
    id: row.id,
    user_id: row.userId,
    kind: row.kind as ContributionKind,
    title: row.title,
    body: row.body,
    event_location: row.eventLocation,
    event_starts_at: row.eventStartsAt?.toISOString() ?? null,
    status: row.status as ContributionStatus,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function toRowWithAuthor(
  row: typeof readerContributions.$inferSelect & { authorEmail?: string | null }
): ContributionWithAuthor {
  return {
    ...toRow(row),
    author: row.authorEmail != null ? { email: row.authorEmail } : null,
  }
}

export async function listApprovedContributions(
  options: { page?: number; limit?: number; kind?: ContributionKind } = {}
): Promise<{ data: ContributionWithAuthor[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(options.limit ?? 24, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const conditions = [eq(readerContributions.status, 'approved')]
  if (options.kind) {
    conditions.push(eq(readerContributions.kind, options.kind))
  }
  const whereClause = and(...conditions)

  const [countRow] = await db.select({ count: count() }).from(readerContributions).where(whereClause)
  const total = countRow?.count ?? 0

  const rows = await db
    .select({
      id: readerContributions.id,
      userId: readerContributions.userId,
      kind: readerContributions.kind,
      title: readerContributions.title,
      body: readerContributions.body,
      eventLocation: readerContributions.eventLocation,
      eventStartsAt: readerContributions.eventStartsAt,
      status: readerContributions.status,
      createdAt: readerContributions.createdAt,
      updatedAt: readerContributions.updatedAt,
      authorEmail: profiles.email,
    })
    .from(readerContributions)
    .leftJoin(profiles, eq(readerContributions.userId, profiles.id))
    .where(whereClause)
    .orderBy(desc(readerContributions.createdAt))
    .limit(limit)
    .offset(offset)

  return {
    data: rows.map((r) =>
      toRowWithAuthor({
        id: r.id,
        userId: r.userId,
        kind: r.kind,
        title: r.title,
        body: r.body,
        eventLocation: r.eventLocation,
        eventStartsAt: r.eventStartsAt,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        authorEmail: r.authorEmail,
      })
    ),
    total,
  }
}

export async function createContribution(
  userId: string,
  input: {
    kind: ContributionKind
    title: string
    body: string
    event_location?: string | null
    event_starts_at?: string | null
  }
): Promise<Contribution> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const eventDate = input.event_starts_at ? new Date(input.event_starts_at) : null
  const [row] = await db
    .insert(readerContributions)
    .values({
      userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      eventLocation: input.event_location?.trim() || null,
      eventStartsAt: eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate : null,
      status: 'pending',
    })
    .returning()
  if (!row) throw new Error('Failed to create contribution')
  return toRow(row)
}

export async function listAllContributions(options: {
  status?: ContributionStatus
  page?: number
  limit?: number
}): Promise<{ data: ContributionWithAuthor[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(options.limit ?? 50, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const whereClause = options.status ? eq(readerContributions.status, options.status) : undefined

  const countQuery = db.select({ count: count() }).from(readerContributions)
  const [countRow] = whereClause ? await countQuery.where(whereClause) : await countQuery
  const total = countRow?.count ?? 0

  const baseQuery = db
    .select({
      id: readerContributions.id,
      userId: readerContributions.userId,
      kind: readerContributions.kind,
      title: readerContributions.title,
      body: readerContributions.body,
      eventLocation: readerContributions.eventLocation,
      eventStartsAt: readerContributions.eventStartsAt,
      status: readerContributions.status,
      createdAt: readerContributions.createdAt,
      updatedAt: readerContributions.updatedAt,
      authorEmail: profiles.email,
    })
    .from(readerContributions)
    .leftJoin(profiles, eq(readerContributions.userId, profiles.id))
    .orderBy(desc(readerContributions.createdAt))
    .limit(limit)
    .offset(offset)

  const rows = whereClause ? await baseQuery.where(whereClause) : await baseQuery

  return {
    data: rows.map((r) =>
      toRowWithAuthor({
        id: r.id,
        userId: r.userId,
        kind: r.kind,
        title: r.title,
        body: r.body,
        eventLocation: r.eventLocation,
        eventStartsAt: r.eventStartsAt,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        authorEmail: r.authorEmail,
      })
    ),
    total,
  }
}

export async function moderateContribution(
  id: string,
  status: ContributionStatus
): Promise<Contribution | null> {
  if (!config.database) return null
  const db = getDb()
  const [row] = await db
    .update(readerContributions)
    .set({ status, updatedAt: new Date() })
    .where(eq(readerContributions.id, id))
    .returning()
  return row ? toRow(row) : null
}

export async function deleteContribution(id: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [deleted] = await db.delete(readerContributions).where(eq(readerContributions.id, id)).returning({ id: readerContributions.id })
  return !!deleted
}
