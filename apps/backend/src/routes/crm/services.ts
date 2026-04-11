import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createServiceSchema, updateServiceSchema } from '../../schemas/crm/service.schema.js'
import * as serviceService from '../../services/crm/service.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const active = c.req.query('active')
  const category = c.req.query('category')
  const limit = Math.min(Number(c.req.query('limit')) || 100, 200)
  const offset = Number(c.req.query('offset')) || 0
  const search = (c.req.query('search') || c.req.query('q') || '').trim() || undefined

  const { data, total } = await serviceService.listServices({
    active: active === 'true' ? true : active === 'false' ? false : undefined,
    category: category || undefined,
    limit,
    offset,
    search,
  })
  return c.json({ data, total })
})

app.post('/', requireRole('manager', 'admin'), async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createServiceSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const service = await serviceService.createService(parsed.data)
  return c.json({ data: service }, 201)
})

app.get('/slug/:slug', async (c) => {
  const slug = c.req.param('slug')
  const service = await serviceService.getServiceBySlug(slug)
  if (!service) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: service })
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const service = await serviceService.getServiceById(id)
  if (!service) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: service })
})

app.patch('/:id', requireRole('manager', 'admin'), async (c) => {
  const id = c.req.param('id')
  const service = await serviceService.getServiceById(id)
  if (!service) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateServiceSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await serviceService.updateService(id, parsed.data)
  return c.json({ data: updated })
})

app.delete('/:id', requireRole('manager', 'admin'), async (c) => {
  const id = c.req.param('id')
  const service = await serviceService.getServiceById(id)
  if (!service) return c.json({ error: 'Not found' }, 404)
  await serviceService.deleteService(id)
  return c.json({ data: { deleted: true } })
})

export default app
