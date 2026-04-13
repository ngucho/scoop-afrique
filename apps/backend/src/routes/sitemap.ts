/**
 * Public sitemap feed — published articles only (slugs + dates).
 */
import { Hono } from 'hono'
import * as articleService from '../services/article.service.js'
import { config } from '../config/env.js'

const app = new Hono()

app.get('/articles', async (c) => {
  if (!config.database) return c.json({ data: [], total: 0, page: 1, limit: 500 })
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 500, 1000)
  const { data, total } = await articleService.listPublishedArticleSitemapEntries({ page, limit })
  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  return c.json({ data, total, page, limit })
})

export default app
