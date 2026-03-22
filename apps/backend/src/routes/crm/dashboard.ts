import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as dashboardService from '../../services/crm/dashboard.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const from = c.req.query('from')?.slice(0, 10)
  const to = c.req.query('to')?.slice(0, 10)
  const re = /^\d{4}-\d{2}-\d{2}$/
  const range =
    from && to && re.test(from) && re.test(to)
      ? { from: from <= to ? from : to, to: from <= to ? to : from }
      : undefined
  const [kpis, activity] = await Promise.all([
    dashboardService.getDashboardKpis(range),
    dashboardService.getRecentActivity(20),
  ])
  return c.json({ data: { kpis, activity } })
})

export default app
