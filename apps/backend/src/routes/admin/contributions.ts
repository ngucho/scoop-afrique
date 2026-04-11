/**
 * Admin moderation for reader contributions.
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { moderateContributionBodySchema } from '../../schemas/contribution.js'
import * as contributionService from '../../services/contribution.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth)
app.use('*', requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const status = c.req.query('status') as contributionService.ContributionStatus | undefined
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const st =
    status === 'pending' || status === 'approved' || status === 'rejected' ? status : undefined
  const { data, total } = await contributionService.listAllContributions({ status: st, page, limit })
  return c.json({ data, total })
})

app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const parsed = moderateContributionBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR' }, 400)
  }
  const row = await contributionService.moderateContribution(id, parsed.data.status)
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: row })
})

app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const ok = await contributionService.deleteContribution(id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
