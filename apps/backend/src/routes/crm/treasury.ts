import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import {
  createTreasuryMovementSchema,
  updateTreasuryMovementSchema,
} from '../../schemas/crm/treasury.schema.js'
import * as treasuryService from '../../services/crm/treasury.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()
app.use('*', requireAuth, requireRole('manager', 'admin'))

app.get('/', async (c) => {
  const direction = c.req.query('direction') as 'income' | 'expense' | undefined
  const category = c.req.query('category') || undefined
  const from = c.req.query('from') || undefined
  const to = c.req.query('to') || undefined
  const sort = c.req.query('sort') as 'occurred_at' | 'created_at' | 'amount' | undefined
  const order = c.req.query('order') as 'asc' | 'desc' | undefined
  const limit = Math.min(Number(c.req.query('limit')) || 100, 200)
  const offset = Number(c.req.query('offset')) || 0

  const { data, total } = await treasuryService.listTreasuryMovements({
    direction: direction === 'income' || direction === 'expense' ? direction : undefined,
    category,
    from,
    to,
    sort: sort || 'occurred_at',
    order: order || 'desc',
    limit,
    offset,
  })
  return c.json({ data, total })
})

app.get('/summary', async (c) => {
  const from = c.req.query('from') || new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().slice(0, 10)
  const to = c.req.query('to') || new Date().toISOString().slice(0, 10)
  const totals = await treasuryService.getTreasuryTotalsInRange(from, to)
  return c.json({ data: { ...totals, from, to } })
})

app.post('/', async (c) => {
  const user = c.get('user')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = createTreasuryMovementSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  const row = await treasuryService.createTreasuryMovement(parsed.data, user.id)
  return c.json({ data: row }, 201)
})

app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const parsed = updateTreasuryMovementSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json({ error: first?.message ?? 'Validation error' }, 400)
  }
  try {
    const row = await treasuryService.updateTreasuryMovement(id, parsed.data)
    return c.json({ data: row })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'Not found') return c.json({ error: 'Not found' }, 404)
    if (msg.startsWith('Catégorie')) return c.json({ error: msg }, 400)
    throw e
  }
})

app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await treasuryService.getTreasuryMovementById(id)
  if (!existing) return c.json({ error: 'Not found' }, 404)
  await treasuryService.deleteTreasuryMovement(id)
  return c.json({ ok: true })
})

export default app
