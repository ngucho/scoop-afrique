import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as reportsService from '../../services/crm/reports.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/

function pickYmd(v: string | undefined): string | undefined {
  const s = v?.trim().slice(0, 10)
  return s && YMD_RE.test(s) ? s : undefined
}

function parseDateRange(c: { req: { query: (k: string) => string | undefined } }): {
  from: string
  to: string
} | undefined {
  const from = pickYmd(c.req.query('from'))
  const to = pickYmd(c.req.query('to'))
  if (!from || !to) return undefined
  return from <= to ? { from, to } : { from: to, to: from }
}

app.get('/', async (c) => {
  const months = Math.min(Math.max(Number(c.req.query('months')) || 12, 1), 36)
  const range = parseDateRange(c) ?? reportsService.defaultReportRange()
  const summary = await reportsService.getReportsSummary(months, range)
  return c.json({ data: summary })
})

app.get('/revenue', async (c) => {
  const months = Math.min(Math.max(Number(c.req.query('months')) || 12, 1), 36)
  const range = parseDateRange(c) ?? reportsService.defaultReportRange()
  const data = await reportsService.getRevenueByMonth(months, range)
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

app.get('/financial/bilan', async (c) => {
  const months = Math.min(Math.max(Number(c.req.query('months')) || 12, 1), 24)
  const range = parseDateRange(c) ?? reportsService.defaultReportRange()
  const data = await reportsService.getFinancialBilanLedger(range.from, range.to, months)
  return c.json({ data })
})

app.get('/financial', async (c) => {
  const months = Math.min(Math.max(Number(c.req.query('months')) || 12, 1), 24)
  const range = parseDateRange(c) ?? reportsService.defaultReportRange()
  const data = await reportsService.getFinancialSummary(range.from, range.to, months)
  return c.json({ data })
})

export default app
