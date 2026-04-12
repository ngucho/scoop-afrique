/**
 * Tribune social layer — votes, reactions, threaded comments, reports.
 */
import { and, asc, count, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import {
  contributionCommentReactions,
  contributionComments,
  contributionReactions,
  contributionReports,
  contributionVotes,
  readerContributions,
  profiles,
  readerPublicProfiles,
} from '../db/schema.js'
import { config } from '../config/env.js'

export function profileActorKey(profileId: string): string {
  return `p:${profileId}`
}

export async function setContributionVote(
  contributionId: string,
  profileId: string,
  value: -1 | 1,
): Promise<{ upvote_count: number; downvote_count: number; your_vote: -1 | 0 | 1 }> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const actorKey = profileActorKey(profileId)

  const [contrib] = await db
    .select({ id: readerContributions.id })
    .from(readerContributions)
    .where(
      and(eq(readerContributions.id, contributionId), eq(readerContributions.status, 'approved')),
    )
    .limit(1)
  if (!contrib) throw new Error('NOT_FOUND')

  const [existing] = await db
    .select()
    .from(contributionVotes)
    .where(
      and(eq(contributionVotes.contributionId, contributionId), eq(contributionVotes.actorKey, actorKey)),
    )
    .limit(1)

  let upDelta = 0
  let downDelta = 0

  if (existing) {
    if (existing.value === value) {
      await db.delete(contributionVotes).where(eq(contributionVotes.id, existing.id))
      if (value === 1) upDelta = -1
      else downDelta = -1
    } else {
      await db
        .update(contributionVotes)
        .set({ value, updatedAt: new Date() })
        .where(eq(contributionVotes.id, existing.id))
      if (existing.value === 1) upDelta = -1
      else downDelta = -1
      if (value === 1) upDelta += 1
      else downDelta += 1
    }
  } else {
    await db.insert(contributionVotes).values({
      contributionId,
      actorKey,
      value,
    })
    if (value === 1) upDelta = 1
    else downDelta = 1
  }

  if (upDelta !== 0 || downDelta !== 0) {
    await db
      .update(readerContributions)
      .set({
        upvoteCount: sql`${readerContributions.upvoteCount} + ${upDelta}`,
        downvoteCount: sql`${readerContributions.downvoteCount} + ${downDelta}`,
        updatedAt: new Date(),
      })
      .where(eq(readerContributions.id, contributionId))
  }

  const [row] = await db
    .select({
      up: readerContributions.upvoteCount,
      down: readerContributions.downvoteCount,
    })
    .from(readerContributions)
    .where(eq(readerContributions.id, contributionId))
    .limit(1)

  const [v] = await db
    .select({ value: contributionVotes.value })
    .from(contributionVotes)
    .where(
      and(eq(contributionVotes.contributionId, contributionId), eq(contributionVotes.actorKey, actorKey)),
    )
    .limit(1)

  return {
    upvote_count: row?.up ?? 0,
    downvote_count: row?.down ?? 0,
    your_vote: (v?.value as -1 | 1 | undefined) ?? 0,
  }
}

/** Public reaction tallies for a contribution (feed display). */
export async function listContributionReactionTallies(
  contributionId: string,
): Promise<{ emoji: string; count: number }[]> {
  if (!config.database) return []
  const db = getDb()
  const tallies = await db
    .select({
      emoji: contributionReactions.emoji,
      n: count(contributionReactions.id),
    })
    .from(contributionReactions)
    .where(eq(contributionReactions.contributionId, contributionId))
    .groupBy(contributionReactions.emoji)
    .orderBy(desc(count(contributionReactions.id)))

  return tallies.map((t) => ({ emoji: t.emoji, count: Number(t.n) }))
}

export async function toggleContributionReaction(
  contributionId: string,
  profileId: string,
  emoji: string,
): Promise<{ reactions: { emoji: string; count: number }[] }> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const actorKey = profileActorKey(profileId)
  const em = emoji.trim().slice(0, 32)
  if (!em) throw new Error('INVALID_EMOJI')

  const [contrib] = await db
    .select({ id: readerContributions.id })
    .from(readerContributions)
    .where(
      and(eq(readerContributions.id, contributionId), eq(readerContributions.status, 'approved')),
    )
    .limit(1)
  if (!contrib) throw new Error('NOT_FOUND')

  const [existing] = await db
    .select()
    .from(contributionReactions)
    .where(
      and(
        eq(contributionReactions.contributionId, contributionId),
        eq(contributionReactions.actorKey, actorKey),
        eq(contributionReactions.emoji, em),
      ),
    )
    .limit(1)

  if (existing) {
    await db.delete(contributionReactions).where(eq(contributionReactions.id, existing.id))
  } else {
    await db.insert(contributionReactions).values({
      contributionId,
      actorKey,
      emoji: em,
    })
  }

  const tallies = await listContributionReactionTallies(contributionId)

  return {
    reactions: tallies,
  }
}

/** Snapshot for feed cards — avoids N separate calls for vote + reactions + comment count. */
export async function getContributionInteractionSummary(
  contributionId: string,
  profileId: string | null,
): Promise<{
  upvote_count: number
  downvote_count: number
  your_vote: -1 | 0 | 1
  reactions: { emoji: string; count: number }[]
  your_reaction_emojis: string[]
  comment_count: number
}> {
  if (!config.database) {
    return {
      upvote_count: 0,
      downvote_count: 0,
      your_vote: 0,
      reactions: [],
      your_reaction_emojis: [],
      comment_count: 0,
    }
  }
  const db = getDb()
  const [contrib] = await db
    .select({
      up: readerContributions.upvoteCount,
      down: readerContributions.downvoteCount,
    })
    .from(readerContributions)
    .where(
      and(eq(readerContributions.id, contributionId), eq(readerContributions.status, 'approved')),
    )
    .limit(1)
  if (!contrib) throw new Error('NOT_FOUND')

  const [ccRow] = await db
    .select({ n: count() })
    .from(contributionComments)
    .where(
      and(
        eq(contributionComments.contributionId, contributionId),
        eq(contributionComments.status, 'approved'),
        isNotNull(contributionComments.authorProfileId),
      ),
    )

  const tallies = await listContributionReactionTallies(contributionId)

  let your_vote: -1 | 0 | 1 = 0
  let your_reaction_emojis: string[] = []
  if (profileId) {
    const actorKey = profileActorKey(profileId)
    const [v] = await db
      .select({ value: contributionVotes.value })
      .from(contributionVotes)
      .where(
        and(eq(contributionVotes.contributionId, contributionId), eq(contributionVotes.actorKey, actorKey)),
      )
      .limit(1)
    your_vote = (v?.value as -1 | 1 | undefined) ?? 0

    const mine = await db
      .select({ emoji: contributionReactions.emoji })
      .from(contributionReactions)
      .where(
        and(
          eq(contributionReactions.contributionId, contributionId),
          eq(contributionReactions.actorKey, actorKey),
        ),
      )
    your_reaction_emojis = mine.map((m) => m.emoji)
  }

  return {
    upvote_count: contrib.up ?? 0,
    downvote_count: contrib.down ?? 0,
    your_vote,
    reactions: tallies,
    your_reaction_emojis,
    comment_count: Number(ccRow?.n ?? 0),
  }
}

export interface ContributionCommentDto {
  id: string
  contribution_id: string
  parent_id: string | null
  body: string
  author_profile_id: string | null
  author_auth0_sub: string | null
  status: string
  is_anonymous: boolean
  created_at: string
  author_email: string | null
  author_pseudo: string | null
  author_display_name: string | null
  author_avatar_url: string | null
  reactions: { emoji: string; count: number }[]
  your_reaction_emojis: string[]
}

export async function listContributionComments(
  contributionId: string,
  viewerProfileId?: string | null,
): Promise<ContributionCommentDto[]> {
  if (!config.database) return []
  const db = getDb()
  const rows = await db
    .select({
      id: contributionComments.id,
      contributionId: contributionComments.contributionId,
      parentId: contributionComments.parentId,
      body: contributionComments.body,
      authorProfileId: contributionComments.authorProfileId,
      authorAuth0Sub: contributionComments.authorAuth0Sub,
      status: contributionComments.status,
      isAnonymous: contributionComments.isAnonymous,
      createdAt: contributionComments.createdAt,
      authorEmail: profiles.email,
      rpPseudo: readerPublicProfiles.pseudo,
      rpDisplay: readerPublicProfiles.displayName,
      rpAvatar: readerPublicProfiles.avatarUrl,
    })
    .from(contributionComments)
    .leftJoin(profiles, eq(contributionComments.authorProfileId, profiles.id))
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .where(
      and(
        eq(contributionComments.contributionId, contributionId),
        eq(contributionComments.status, 'approved'),
        isNotNull(contributionComments.authorProfileId),
      ),
    )
    .orderBy(asc(contributionComments.createdAt))

  const ids = rows.map((r) => r.id)
  const talliesByComment = new Map<string, { emoji: string; count: number }[]>()
  const yoursByComment = new Map<string, string[]>()
  if (ids.length > 0) {
    const tallyRows = await db
      .select({
        commentId: contributionCommentReactions.commentId,
        emoji: contributionCommentReactions.emoji,
        n: count(contributionCommentReactions.id),
      })
      .from(contributionCommentReactions)
      .where(inArray(contributionCommentReactions.commentId, ids))
      .groupBy(contributionCommentReactions.commentId, contributionCommentReactions.emoji)

    for (const t of tallyRows) {
      const list = talliesByComment.get(t.commentId) ?? []
      list.push({ emoji: t.emoji, count: Number(t.n) })
      talliesByComment.set(t.commentId, list)
    }

    if (viewerProfileId) {
      const actorKey = profileActorKey(viewerProfileId)
      const mine = await db
        .select({
          commentId: contributionCommentReactions.commentId,
          emoji: contributionCommentReactions.emoji,
        })
        .from(contributionCommentReactions)
        .where(
          and(
            inArray(contributionCommentReactions.commentId, ids),
            eq(contributionCommentReactions.actorKey, actorKey),
          ),
        )
      for (const m of mine) {
        const arr = yoursByComment.get(m.commentId) ?? []
        arr.push(m.emoji)
        yoursByComment.set(m.commentId, arr)
      }
    }
  }

  return rows.map((r) => ({
    id: r.id,
    contribution_id: r.contributionId,
    parent_id: r.parentId,
    body: r.body,
    author_profile_id: r.authorProfileId,
    author_auth0_sub: r.authorAuth0Sub,
    status: r.status,
    is_anonymous: r.isAnonymous,
    created_at: r.createdAt.toISOString(),
    author_email: r.isAnonymous ? null : r.authorEmail,
    author_pseudo: r.isAnonymous ? null : r.rpPseudo,
    author_display_name: r.isAnonymous ? null : r.rpDisplay,
    author_avatar_url: r.isAnonymous ? null : r.rpAvatar,
    reactions: talliesByComment.get(r.id) ?? [],
    your_reaction_emojis: yoursByComment.get(r.id) ?? [],
  }))
}

export async function createContributionComment(input: {
  contributionId: string
  authorProfileId: string
  authorAuth0Sub?: string | null
  parentId?: string | null
  body: string
  is_anonymous?: boolean
}): Promise<ContributionCommentDto> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()

  const [contrib] = await db
    .select({ id: readerContributions.id })
    .from(readerContributions)
    .where(
      and(
        eq(readerContributions.id, input.contributionId),
        eq(readerContributions.status, 'approved'),
      ),
    )
    .limit(1)
  if (!contrib) throw new Error('NOT_FOUND')

  if (input.parentId) {
    const [parent] = await db
      .select({ id: contributionComments.id })
      .from(contributionComments)
      .where(
        and(
          eq(contributionComments.id, input.parentId),
          eq(contributionComments.contributionId, input.contributionId),
        ),
      )
      .limit(1)
    if (!parent) throw new Error('INVALID_PARENT')
  }

  const [row] = await db
    .insert(contributionComments)
    .values({
      contributionId: input.contributionId,
      authorProfileId: input.authorProfileId,
      authorAuth0Sub: input.authorAuth0Sub?.trim() || null,
      parentId: input.parentId ?? null,
      body: input.body.trim(),
      status: 'approved',
      isAnonymous: Boolean(input.is_anonymous),
    })
    .returning()

  if (!row) throw new Error('INSERT_FAILED')

  const [pub] = await db
    .select({
      email: profiles.email,
      pseudo: readerPublicProfiles.pseudo,
      displayName: readerPublicProfiles.displayName,
      avatarUrl: readerPublicProfiles.avatarUrl,
    })
    .from(profiles)
    .leftJoin(readerPublicProfiles, eq(profiles.auth0Id, readerPublicProfiles.auth0Sub))
    .where(eq(profiles.id, input.authorProfileId))
    .limit(1)

  const anon = Boolean(input.is_anonymous)
  return {
    id: row.id,
    contribution_id: row.contributionId,
    parent_id: row.parentId,
    body: row.body,
    author_profile_id: row.authorProfileId,
    author_auth0_sub: row.authorAuth0Sub,
    status: row.status,
    is_anonymous: anon,
    created_at: row.createdAt.toISOString(),
    author_email: anon ? null : pub?.email ?? null,
    author_pseudo: anon ? null : pub?.pseudo ?? null,
    author_display_name: anon ? null : pub?.displayName ?? null,
    author_avatar_url: anon ? null : pub?.avatarUrl ?? null,
    reactions: [],
    your_reaction_emojis: [],
  }
}

export async function toggleContributionCommentReaction(input: {
  contributionId: string
  commentId: string
  profileId: string
  emoji: string
}): Promise<{ reactions: { emoji: string; count: number }[] }> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  const actorKey = profileActorKey(input.profileId)
  const em = input.emoji.trim().slice(0, 32)
  if (!em) throw new Error('INVALID_EMOJI')

  const [comment] = await db
    .select({
      id: contributionComments.id,
      contributionId: contributionComments.contributionId,
      status: contributionComments.status,
    })
    .from(contributionComments)
    .where(
      and(
        eq(contributionComments.id, input.commentId),
        eq(contributionComments.contributionId, input.contributionId),
        eq(contributionComments.status, 'approved'),
      ),
    )
    .limit(1)
  if (!comment) throw new Error('NOT_FOUND')

  const [existing] = await db
    .select()
    .from(contributionCommentReactions)
    .where(
      and(
        eq(contributionCommentReactions.commentId, input.commentId),
        eq(contributionCommentReactions.actorKey, actorKey),
        eq(contributionCommentReactions.emoji, em),
      ),
    )
    .limit(1)

  if (existing) {
    await db.delete(contributionCommentReactions).where(eq(contributionCommentReactions.id, existing.id))
  } else {
    await db.insert(contributionCommentReactions).values({
      commentId: input.commentId,
      actorKey,
      emoji: em,
    })
  }

  const tallies = await db
    .select({
      emoji: contributionCommentReactions.emoji,
      n: count(contributionCommentReactions.id),
    })
    .from(contributionCommentReactions)
    .where(eq(contributionCommentReactions.commentId, input.commentId))
    .groupBy(contributionCommentReactions.emoji)

  return {
    reactions: tallies.map((t) => ({ emoji: t.emoji, count: Number(t.n) })),
  }
}

export async function createContributionReport(input: {
  contributionId: string
  reporterActorKey: string
  reason: string
  details?: string | null
}): Promise<void> {
  if (!config.database) throw new Error('Database not configured')
  const db = getDb()
  await db.insert(contributionReports).values({
    contributionId: input.contributionId,
    reporterActorKey: input.reporterActorKey,
    reason: input.reason.trim().slice(0, 200),
    details: input.details?.trim().slice(0, 2000) || null,
  })
}
