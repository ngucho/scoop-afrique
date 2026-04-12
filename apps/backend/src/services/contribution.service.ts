/**
 * Reader contributions — community hub (analyses + event announcements).
 */
import { and, count, desc, eq, lt, or, sql } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { contributionComments, profiles, readerContributions, readerPublicProfiles } from '../db/schema.js'
import { config } from '../config/env.js'

export type ContributionKind = 'writing' | 'event'
export type ContributionStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface ContributionAuthorPublic {
  profile_id: string
  pseudo: string | null
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

export interface Contribution {
  id: string
  user_id: string
  article_id: string | null
  kind: ContributionKind
  title: string
  body: string
  event_location: string | null
  event_starts_at: string | null
  status: ContributionStatus
  is_anonymous: boolean
  upvote_count: number
  downvote_count: number
  /** Nombre de commentaires approuvés (fil). */
  comment_count?: number
  created_at: string
  updated_at: string
}

export interface ContributionWithAuthor extends Contribution {
  author: ContributionAuthorPublic | null
}

function toRow(row: typeof readerContributions.$inferSelect): Contribution {
  return {
    id: row.id,
    user_id: row.userId,
    article_id: row.articleId ?? null,
    kind: row.kind as ContributionKind,
    title: row.title,
    body: row.body,
    event_location: row.eventLocation,
    event_starts_at: row.eventStartsAt?.toISOString() ?? null,
    status: row.status as ContributionStatus,
    is_anonymous: row.isAnonymous,
    upvote_count: row.upvoteCount,
    downvote_count: row.downvoteCount,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

type JoinedRow = {
  id: string
  userId: string
  articleId: string | null
  kind: string
  title: string
  body: string
  eventLocation: string | null
  eventStartsAt: Date | null
  status: string
  isAnonymous: boolean
  upvoteCount: number
  downvoteCount: number
  createdAt: Date
  updatedAt: Date
  authorEmail: string | null
  authorPseudo: string | null
  authorDisplayName: string | null
  authorAvatarUrl: string | null
  commentCount: number | null
}

function mapJoinedToWithAuthor(r: JoinedRow): ContributionWithAuthor {
  const cc = r.commentCount != null ? Number(r.commentCount) : 0
  const base = toRow({
    id: r.id,
    userId: r.userId,
    articleId: r.articleId,
    kind: r.kind as 'writing' | 'event',
    title: r.title,
    body: r.body,
    eventLocation: r.eventLocation,
    eventStartsAt: r.eventStartsAt,
    status: r.status as ContributionStatus,
    isAnonymous: r.isAnonymous,
    upvoteCount: r.upvoteCount,
    downvoteCount: r.downvoteCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  } as typeof readerContributions.$inferSelect)

  if (r.isAnonymous) {
    return { ...base, comment_count: cc, author: null }
  }

  return {
    ...base,
    comment_count: cc,
    author: {
      profile_id: r.userId,
      pseudo: r.authorPseudo,
      display_name: r.authorDisplayName,
      avatar_url: r.authorAvatarUrl,
      email: r.authorEmail,
    },
  }
}

const contributionSelect = {
  id: readerContributions.id,
  userId: readerContributions.userId,
  articleId: readerContributions.articleId,
  kind: readerContributions.kind,
  title: readerContributions.title,
  body: readerContributions.body,
  eventLocation: readerContributions.eventLocation,
  eventStartsAt: readerContributions.eventStartsAt,
  status: readerContributions.status,
  isAnonymous: readerContributions.isAnonymous,
  upvoteCount: readerContributions.upvoteCount,
  downvoteCount: readerContributions.downvoteCount,
  createdAt: readerContributions.createdAt,
  updatedAt: readerContributions.updatedAt,
  authorEmail: profiles.email,
  authorPseudo: readerPublicProfiles.pseudo,
  authorDisplayName: readerPublicProfiles.displayName,
  authorAvatarUrl: readerPublicProfiles.avatarUrl,
  commentCount: sql<number>`(
    SELECT COUNT(*)::int FROM ${contributionComments} cc
    WHERE cc.contribution_id = ${readerContributions.id}
      AND cc.status = 'approved'
      AND cc.author_profile_id IS NOT NULL
  )`.as('comment_count'),
}

function baseContributionQuery(db: ReturnType<typeof getDb>) {
  return db
    .select(contributionSelect)
    .from(readerContributions)
    .innerJoin(profiles, eq(readerContributions.userId, profiles.id))
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
}

export async function listApprovedContributions(
  options: { page?: number; limit?: number; kind?: ContributionKind; author_profile_id?: string } = {},
): Promise<{ data: ContributionWithAuthor[]; total: number }> {
  if (!config.database) return { data: [], total: 0 }
  const db = getDb()
  const limit = Math.min(options.limit ?? 24, 100)
  const offset = ((options.page ?? 1) - 1) * limit

  const conditions = [eq(readerContributions.status, 'approved')]
  if (options.kind) {
    conditions.push(eq(readerContributions.kind, options.kind))
  }
  if (options.author_profile_id) {
    conditions.push(eq(readerContributions.userId, options.author_profile_id))
  }
  const whereClause = and(...conditions)

  const [countRow] = await db.select({ count: count() }).from(readerContributions).where(whereClause)
  const total = countRow?.count ?? 0

  const rows = await baseContributionQuery(db)
    .where(whereClause)
    .orderBy(desc(readerContributions.createdAt))
    .limit(limit)
    .offset(offset)

  return {
    data: rows.map((r) => mapJoinedToWithAuthor(r as JoinedRow)),
    total,
  }
}

/** Cursor-based feed (latest or trending). */
export async function listPublicContributionsCursor(options: {
  limit?: number
  cursor?: string | null
  sort?: 'latest' | 'trending'
  kind?: ContributionKind
  author_profile_id?: string
}): Promise<{ data: ContributionWithAuthor[]; next_cursor: string | null }> {
  if (!config.database) return { data: [], next_cursor: null }
  const db = getDb()
  const limit = Math.min(options.limit ?? 24, 100)
  const sort = options.sort ?? 'latest'

  const parts = [eq(readerContributions.status, 'approved')]
  if (options.kind) {
    parts.push(eq(readerContributions.kind, options.kind))
  }
  if (options.author_profile_id) {
    parts.push(eq(readerContributions.userId, options.author_profile_id))
  }

  let cursorDate: Date | null = null
  let cursorId: string | null = null
  if (options.cursor?.includes('|')) {
    const [d, id] = options.cursor.split('|')
    if (d && id) {
      const parsed = new Date(d)
      if (!Number.isNaN(parsed.getTime())) {
        cursorDate = parsed
        cursorId = id
      }
    }
  }

  if (cursorDate && cursorId && sort === 'latest') {
    parts.push(
      or(
        lt(readerContributions.createdAt, cursorDate),
        and(eq(readerContributions.createdAt, cursorDate), lt(readerContributions.id, cursorId)),
      )!,
    )
  }

  const whereClause = and(...parts)

  const orderByLatest = [
    desc(readerContributions.createdAt),
    desc(readerContributions.id),
  ] as const
  const orderByTrending = [
    desc(sql`(${readerContributions.upvoteCount} - ${readerContributions.downvoteCount})`),
    desc(readerContributions.createdAt),
    desc(readerContributions.id),
  ] as const

  const rows = await baseContributionQuery(db)
    .where(whereClause)
    .orderBy(...(sort === 'trending' ? orderByTrending : orderByLatest))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const slice = hasMore ? rows.slice(0, limit) : rows
  const last = slice[slice.length - 1]
  const next_cursor =
    sort === 'latest' && hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null

  return {
    data: slice.map((r) => mapJoinedToWithAuthor(r as JoinedRow)),
    next_cursor,
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
    article_id?: string | null
    is_anonymous?: boolean
  },
): Promise<Contribution> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const eventDate = input.event_starts_at ? new Date(input.event_starts_at) : null
  const [row] = await db
    .insert(readerContributions)
    .values({
      userId,
      articleId: input.article_id?.trim() ? input.article_id.trim() : null,
      kind: input.kind,
      title: input.title,
      body: input.body,
      eventLocation: input.event_location?.trim() || null,
      eventStartsAt: eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate : null,
      status: 'approved',
      isAnonymous: Boolean(input.is_anonymous),
    })
    .returning()
  if (!row) throw new Error('Failed to create contribution')
  return toRow(row)
}

export async function updateContributionForAuthor(
  id: string,
  authorProfileId: string,
  input: {
    kind?: ContributionKind
    title?: string
    body?: string
    event_location?: string | null
    event_starts_at?: string | null
    article_id?: string | null
    is_anonymous?: boolean
  },
): Promise<Contribution | null> {
  if (!config.database) return null
  const db = getDb()
  const [existing] = await db
    .select()
    .from(readerContributions)
    .where(and(eq(readerContributions.id, id), eq(readerContributions.userId, authorProfileId)))
    .limit(1)
  if (!existing) return null

  const eventDate =
    input.event_starts_at !== undefined
      ? input.event_starts_at
        ? new Date(input.event_starts_at)
        : null
      : existing.eventStartsAt

  const [row] = await db
    .update(readerContributions)
    .set({
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.event_location !== undefined ? { eventLocation: input.event_location?.trim() || null } : {}),
      ...(input.event_starts_at !== undefined
        ? {
            eventStartsAt:
              eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate : null,
          }
        : {}),
      ...(input.article_id !== undefined
        ? { articleId: input.article_id?.trim() ? input.article_id.trim() : null }
        : {}),
      ...(input.is_anonymous !== undefined ? { isAnonymous: input.is_anonymous } : {}),
      updatedAt: new Date(),
    })
    .where(eq(readerContributions.id, id))
    .returning()
  return row ? toRow(row) : null
}

export async function deleteContributionForAuthor(id: string, authorProfileId: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [del] = await db
    .delete(readerContributions)
    .where(and(eq(readerContributions.id, id), eq(readerContributions.userId, authorProfileId)))
    .returning({ id: readerContributions.id })
  return !!del
}

export async function getContributionById(id: string): Promise<ContributionWithAuthor | null> {
  if (!config.database) return null
  const db = getDb()
  const [r] = await baseContributionQuery(db).where(eq(readerContributions.id, id)).limit(1)
  return r ? mapJoinedToWithAuthor(r as JoinedRow) : null
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

  const baseQuery = baseContributionQuery(db)
    .orderBy(desc(readerContributions.createdAt))
    .limit(limit)
    .offset(offset)

  const rows = whereClause ? await baseQuery.where(whereClause) : await baseQuery

  return {
    data: rows.map((r) => mapJoinedToWithAuthor(r as JoinedRow)),
    total,
  }
}

export async function moderateContribution(
  id: string,
  status: ContributionStatus,
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
