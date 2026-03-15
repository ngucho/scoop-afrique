import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as reportsService from '../../services/crm/reports.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const months = Math.min(Math.max(Number(c.req.query('months')) || 12, 1), 24)
  const summary = await reportsService.getReportsSummary(months)
  return c.json({ data: summary })
})

app.get('/revenue', async (c) => {
  const months = Math.min(Math.max(Number(c.req.query('months')) || 12, 1), 24)
  const data = await reportsService.getRevenueByMonth(months)
  return c.json({ data })
})

app.get('/devis-status', async (c) => {
  const data = await reportsService.getDevisByStatus()
  return c.json({ data })
})

app.get('/pipeline', async (c) => {
  const data = await reportsService.getPipelineFunnel()
  return c.json({ data })
})

app.get('/conversion', async (c) => {
  const data = await reportsService.getConversionRates()
  return c.json({ data })
})

app.get('/financial', async (c) => {
  const startDate = c.req.query('start') || undefined
  const endDate = c.req.query('end') || undefined
  const months = Math.min(Math.max(Number(c.req.query('months')) || 12, 1), 24)
  const data = await reportsService.getFinancialSummary(startDate, endDate, months)
  return c.json({ data })
})

export default app
