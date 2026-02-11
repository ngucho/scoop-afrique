/**
 * Public category routes.
 * - GET /           — list all categories
 * - GET /:idOrSlug  — get a single category
 */
import { Hono } from 'hono'
import * as categoryService from '../services/category.service.js'

const app = new Hono()

app.get('/', async (c) => {
  const data = await categoryService.listCategories()
  // Categories rarely change — cache 10 minutes, stale for 1 hour
  c.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
  return c.json({ data })
})

app.get('/:idOrSlug', async (c) => {
  const idOrSlug = c.req.param('idOrSlug')
  const category = await categoryService.getCategoryByIdOrSlug(idOrSlug)
  if (!category) return c.json({ error: 'Not found' }, 404)
  c.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600')
  return c.json({ data: category })
})

export default app
