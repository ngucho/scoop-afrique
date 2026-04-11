/**
 * Public homepage CMS — visible sections only (no auth).
 */
import { Hono } from 'hono'
import { config } from '../config/env.js'
import * as reader from '../services/reader-platform.service.js'

const app = new Hono()

app.get('/sections', async (c) => {
  if (!config.database) {
    return c.json({ data: [] })
  }
  const rows = await reader.listPublicHomepageSections()
  return c.json({ data: rows.map(reader.rowHomepageSection) }, 200, {
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
  })
})

export default app
