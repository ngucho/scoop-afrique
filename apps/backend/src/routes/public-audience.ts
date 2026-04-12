/**
 * Public read-only audience KPI summary (brands site, media kit).
 * No auth — only non-sensitive aggregates configured in back-office.
 */
import { Hono } from 'hono'
import * as audienceMetrics from '../services/audience-metric.service.js'

const app = new Hono()

app.get('/summary', async (c) => {
  const data = await audienceMetrics.getLatestAudienceMetricsByKey()
  return c.json({ data })
})

export default app
