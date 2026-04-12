/**
 * Public reader contributions (Tribune) + social interactions.
 */
import { Hono } from 'hono'
import { optionalContributorAuth, requireContributorAuth } from '../middleware/contributor-auth.js'
import {
  createContributionBodySchema,
  contributionVoteBodySchema,
  contributionReactionBodySchema,
  contributionCommentBodySchema,
  contributionReportBodySchema,
  updateContributionBodySchema,
} from '../schemas/contribution.js'
import * as contributionService from '../services/contribution.service.js'
import * as contributionSocial from '../services/contribution-social.service.js'
import type { AppEnv } from '../types.js'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  const cursor = c.req.query('cursor')?.trim() || undefined
  const pageQ = c.req.query('page')
  const sortRaw = c.req.query('sort')
  const sort = sortRaw === 'trending' ? 'trending' : 'latest'
  const limit = Math.min(Number(c.req.query('limit')) || 24, 100)
  const kind = c.req.query('kind') as contributionService.ContributionKind | undefined
  const k = kind === 'writing' || kind === 'event' ? kind : undefined
  const authorProfileId = c.req.query('author_profile_id')?.trim() || undefined

  const useLegacyPage = pageQ != null && pageQ !== '' && !cursor

  if (!useLegacyPage) {
    const { data, next_cursor } = await contributionService.listPublicContributionsCursor({
      cursor: cursor ?? null,
      limit,
      sort,
      kind: k,
      author_profile_id: authorProfileId,
    })
    return c.json({ data, next_cursor })
  }

  const page = Number(pageQ) || 1
  const { data, total } = await contributionService.listApprovedContributions({
    page,
    limit,
    kind: k,
    author_profile_id: authorProfileId,
  })
  return c.json({ data, total })
})

app.post('/', requireContributorAuth, async (c) => {
  const contributor = c.get('contributor' as never) as {
    profileId: string
    auth0Sub: string
    email: string
    isReader: boolean
  }
  const parsed = createContributionBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const contribution = await contributionService.createContribution(contributor.profileId, {
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body,
    event_location: parsed.data.event_location,
    event_starts_at: parsed.data.event_starts_at,
    article_id: parsed.data.article_id,
    is_anonymous: parsed.data.is_anonymous,
  })
  return c.json({ data: contribution }, 201)
})

app.get('/:id/reactions', async (c) => {
  const id = c.req.param('id')
  const reactions = await contributionSocial.listContributionReactionTallies(id)
  return c.json({ data: { reactions } })
})

app.get('/:id/interaction', optionalContributorAuth, async (c) => {
  const id = c.req.param('id')
  const contributor = c.get('contributor' as never) as { profileId: string } | undefined
  try {
    const data = await contributionSocial.getContributionInteractionSummary(id, contributor?.profileId ?? null)
    return c.json({ data })
  } catch (e) {
    if ((e as Error).message === 'NOT_FOUND') return c.json({ error: 'Not found' }, 404)
    throw e
  }
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const row = await contributionService.getContributionById(id)
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: row })
})

app.patch('/:id', requireContributorAuth, async (c) => {
  const id = c.req.param('id')
  const contributor = c.get('contributor' as never) as { profileId: string }
  const parsed = updateContributionBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await contributionService.updateContributionForAuthor(id, contributor.profileId, parsed.data)
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: row })
})

app.delete('/:id', requireContributorAuth, async (c) => {
  const id = c.req.param('id')
  const contributor = c.get('contributor' as never) as { profileId: string }
  const ok = await contributionService.deleteContributionForAuthor(id, contributor.profileId)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

app.post('/:id/votes', requireContributorAuth, async (c) => {
  const id = c.req.param('id')
  const contributor = c.get('contributor' as never) as { profileId: string }
  const parsed = contributionVoteBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)
  }
  try {
    const data = await contributionSocial.setContributionVote(id, contributor.profileId, parsed.data.value)
    return c.json({ data })
  } catch (e) {
    if ((e as Error).message === 'NOT_FOUND') return c.json({ error: 'Not found' }, 404)
    throw e
  }
})

app.post('/:id/reactions', requireContributorAuth, async (c) => {
  const id = c.req.param('id')
  const contributor = c.get('contributor' as never) as { profileId: string }
  const parsed = contributionReactionBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)
  }
  try {
    const data = await contributionSocial.toggleContributionReaction(
      id,
      contributor.profileId,
      parsed.data.emoji,
    )
    return c.json({ data })
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'NOT_FOUND') return c.json({ error: 'Not found' }, 404)
    if (msg === 'INVALID_EMOJI') return c.json({ error: 'Invalid emoji' }, 400)
    throw e
  }
})

app.get('/:id/comments', optionalContributorAuth, async (c) => {
  const id = c.req.param('id')
  const contributor = c.get('contributor' as never) as { profileId: string } | undefined
  const data = await contributionSocial.listContributionComments(id, contributor?.profileId ?? null)
  return c.json({ data })
})

app.post('/:id/comments/:commentId/reactions', requireContributorAuth, async (c) => {
  const contributionId = c.req.param('id')
  const commentId = c.req.param('commentId')
  const contributor = c.get('contributor' as never) as { profileId: string }
  const parsed = contributionReactionBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)
  }
  try {
    const data = await contributionSocial.toggleContributionCommentReaction({
      contributionId,
      commentId,
      profileId: contributor.profileId,
      emoji: parsed.data.emoji,
    })
    return c.json({ data })
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'NOT_FOUND') return c.json({ error: 'Not found' }, 404)
    if (msg === 'INVALID_EMOJI') return c.json({ error: 'Invalid emoji' }, 400)
    throw e
  }
})

app.post('/:id/comments', requireContributorAuth, async (c) => {
  const id = c.req.param('id')
  const contributor = c.get('contributor' as never) as { profileId: string; auth0Sub: string }
  const parsed = contributionCommentBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)
  }
  try {
    const data = await contributionSocial.createContributionComment({
      contributionId: id,
      authorProfileId: contributor.profileId,
      authorAuth0Sub: contributor.auth0Sub,
      parentId: parsed.data.parent_id,
      body: parsed.data.body,
      is_anonymous: parsed.data.is_anonymous,
    })
    return c.json({ data }, 201)
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'NOT_FOUND') return c.json({ error: 'Not found' }, 404)
    if (msg === 'INVALID_PARENT') return c.json({ error: 'Invalid parent comment' }, 400)
    throw e
  }
})

app.post('/:id/reports', requireContributorAuth, async (c) => {
  const id = c.req.param('id')
  const contributor = c.get('contributor' as never) as { profileId: string }
  const parsed = contributionReportBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)
  }
  await contributionSocial.createContributionReport({
    contributionId: id,
    reporterActorKey: contributionSocial.profileActorKey(contributor.profileId),
    reason: parsed.data.reason,
    details: parsed.data.details,
  })
  return c.json({ ok: true }, 201)
})

export default app
