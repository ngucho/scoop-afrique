/**
 * Public ads — placements + optional impression/click tracking.
 */
import { Hono } from 'hono'
import { recordAdEventBodySchema } from '../schemas/ads.js'
import * as adService from '../services/ad.service.js'
import { config } from '../config/env.js'

const app = new Hono()

app.get('/placements', async (c) => {
  if (!config.database) {
    return c.json({ data: { slots: [], creatives_by_slot: {} } })
  }
  const data = await adService.getActivePlacements()
  c.header('Cache-Control', 'public, max-age=15, stale-while-revalidate=60')
  return c.json({ data })
})

app.post('/events/impression', async (c) => {
  const parsed = recordAdEventBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  if (!config.database) return c.json({ data: { id: null } })
  const row = await adService.recordImpression(parsed.data)
  return c.json({ data: { id: row?.id ?? null } }, 201)
})

app.post('/events/click', async (c) => {
  const parsed = recordAdEventBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  if (!config.database) return c.json({ data: { id: null } })
  const row = await adService.recordClick(parsed.data)
  return c.json({ data: { id: row?.id ?? null } }, 201)
})

export default app
