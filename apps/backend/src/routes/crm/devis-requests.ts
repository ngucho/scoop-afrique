import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as devisRequestsService from '../../services/devis-requests.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const offset = Number(c.req.query('offset')) || 0
  const { data, total } = await devisRequestsService.listDevisRequests({ limit, offset })
  return c.json({ data, total })
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const req = await devisRequestsService.getDevisRequestById(id)
  if (!req) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: req })
})

app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const req = await devisRequestsService.getDevisRequestById(id)
  if (!req) return c.json({ error: 'Not found' }, 404)

  let body: { converted_to_contact_id?: string; converted_to_devis_id?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const updated = await devisRequestsService.updateDevisRequestConversion(id, body)
  return c.json({ data: updated, message: 'Updated' })
})

export default app
