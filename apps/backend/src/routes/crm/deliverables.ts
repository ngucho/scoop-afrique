import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { updateDeliverableSchema, deliverableMetricsSchema } from '../../schemas/crm/deliverable.schema.js'
import * as deliverableService from '../../services/crm/deliverable.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const deliverable = await deliverableService.getDeliverableById(id)
  if (!deliverable) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateDeliverableSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const updated = await deliverableService.updateDeliverable(id, parsed.data)
  return c.json({ data: updated })
})

app.post('/:id/metrics', async (c) => {
  const id = c.req.param('id')
  const deliverable = await deliverableService.getDeliverableById(id)
  if (!deliverable) return c.json({ error: 'Not found' }, 404)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = deliverableMetricsSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const metrics = await deliverableService.addDeliverableMetrics(id, parsed.data)
  return c.json({ data: metrics }, 201)
})

app.get('/:id/metrics', async (c) => {
  const id = c.req.param('id')
  const deliverable = await deliverableService.getDeliverableById(id)
  if (!deliverable) return c.json({ error: 'Not found' }, 404)
  const limit = Number(c.req.query('limit')) || 50
  const metrics = await deliverableService.getDeliverableMetrics(id, limit)
  return c.json({ data: metrics })
})

export default app
