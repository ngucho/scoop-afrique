/**
 * Admin category routes — CRUD.
 *
 * - GET    /          — list categories (also public, but auth required here)
 * - POST   /          — create category
 * - PATCH  /:id       — update category
 * - DELETE /:id       — delete category
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createCategoryBodySchema, updateCategoryBodySchema } from '../../schemas/category.js'
import * as categoryService from '../../services/category.service.js'

const app = new Hono()

app.use('*', requireAuth)

/* --- List (journalist, editor, manager, admin can view) --- */
app.get('/', async (c) => {
  const data = await categoryService.listCategories()
  return c.json({ data })
})

/* --- Create, Update, Delete (manager+ only) --- */
app.post('/', requireRole('manager', 'admin'), async (c) => {
  const parsed = createCategoryBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const category = await categoryService.createCategory(
    parsed.data.name,
    parsed.data.slug,
    parsed.data.description
  )
  return c.json({ data: category }, 201)
})

/* --- Update --- */
app.patch('/:id', requireRole('manager', 'admin'), async (c) => {
  const id = c.req.param('id')
  const parsed = updateCategoryBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR' }, 400)
  }
  const category = await categoryService.updateCategory(id, parsed.data)
  if (!category) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: category })
})

/* --- Delete --- */
app.delete('/:id', requireRole('manager', 'admin'), async (c) => {
  const id = c.req.param('id')
  const ok = await categoryService.deleteCategory(id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
