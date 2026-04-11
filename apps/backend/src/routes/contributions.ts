/**
 * Public reader contributions.
 * - GET  /contributions — list approved
 * - POST /contributions — create (auth, pending moderation)
 */
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { createContributionBodySchema } from '../schemas/contribution.js'
import * as contributionService from '../services/contribution.service.js'
import type { AppEnv } from '../types.js'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 24, 100)
  const kind = c.req.query('kind') as contributionService.ContributionKind | undefined
  const k = kind === 'writing' || kind === 'event' ? kind : undefined
  const { data, total } = await contributionService.listApprovedContributions({ page, limit, kind: k })
  return c.json({ data, total })
})

app.post('/', requireAuth, async (c) => {
  const user = c.get('user')
  const parsed = createContributionBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const contribution = await contributionService.createContribution(user.id, {
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body,
    event_location: parsed.data.event_location,
    event_starts_at: parsed.data.event_starts_at,
  })
  return c.json({ data: contribution }, 201)
})

export default app
