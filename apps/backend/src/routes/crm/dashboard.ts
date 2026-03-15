import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as dashboardService from '../../services/crm/dashboard.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const [kpis, activity] = await Promise.all([
    dashboardService.getDashboardKpis(),
    dashboardService.getRecentActivity(20),
  ])
  return c.json({ data: { kpis, activity } })
})

export default app
