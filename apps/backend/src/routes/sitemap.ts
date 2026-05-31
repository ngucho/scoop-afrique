/**
 * Public sitemap feed — published articles.
 * - GET /articles     — slugs + dates for standard sitemap.xml
 * - GET /news         — recent articles with titles for Google News sitemap
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

/** Google News sitemap data — articles from the last 72 hours with title/tags */
app.get('/news', async (c) => {
  if (!config.database) return c.json({ data: [] })
  const hours = Math.min(Math.max(Number(c.req.query('hours')) || 72, 1), 168)
  const data = await articleService.listNewsArticlesForSitemap(hours)
  // Short cache — Google News re-crawls frequently
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  return c.json({ data })
})

export default app
