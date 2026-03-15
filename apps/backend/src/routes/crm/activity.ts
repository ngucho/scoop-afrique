import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as activityService from '../../services/crm/activity.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit')) || 100, 200)
  const log = await activityService.getGlobalActivity(limit)
  return c.json({ data: log })
})

app.get('/:entityType/:entityId', async (c) => {
  const entityType = c.req.param('entityType')
  const entityId = c.req.param('entityId')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const log = await activityService.getActivityLog(entityType, entityId, limit)
  return c.json({ data: log })
})

export default app
