/**
 * Admin ads — slots, campaigns, creatives (manager+).
 */
import { Hono } from 'hono'
import {
  createAdCampaignBodySchema,
  createAdCreativeBodySchema,
  createAdSlotBodySchema,
  updateAdCampaignBodySchema,
  updateAdCreativeBodySchema,
  updateAdSlotBodySchema,
} from '../../schemas/ads.js'
import * as adService from '../../services/ad.service.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth, requireRole('manager', 'admin'))

/* --- Slots --- */
app.get('/slots', async (c) => {
  const data = await adService.listAdSlots()
  return c.json({ data })
})

app.post('/slots', async (c) => {
  const parsed = createAdSlotBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await adService.createAdSlot(parsed.data)
  return c.json({ data }, 201)
})

app.patch('/slots/:id', async (c) => {
  const parsed = updateAdSlotBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await adService.updateAdSlot(c.req.param('id'), parsed.data)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.delete('/slots/:id', async (c) => {
  const ok = await adService.deleteAdSlot(c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

/* --- Campaigns --- */
app.get('/campaigns', async (c) => {
  const data = await adService.listAdCampaigns()
  return c.json({ data })
})

app.post('/campaigns', async (c) => {
  const parsed = createAdCampaignBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await adService.createAdCampaign(parsed.data)
  return c.json({ data }, 201)
})

app.patch('/campaigns/:id', async (c) => {
  const parsed = updateAdCampaignBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await adService.updateAdCampaign(c.req.param('id'), parsed.data)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.delete('/campaigns/:id', async (c) => {
  const ok = await adService.deleteAdCampaign(c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

/* --- Creatives --- */
app.get('/creatives', async (c) => {
  const campaignId = c.req.query('campaign_id') ?? undefined
  const data = await adService.listAdCreatives(campaignId)
  return c.json({ data })
})

app.post('/creatives', async (c) => {
  const parsed = createAdCreativeBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await adService.createAdCreative(parsed.data)
  return c.json({ data }, 201)
})

app.patch('/creatives/:id', async (c) => {
  const parsed = updateAdCreativeBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await adService.updateAdCreative(c.req.param('id'), parsed.data)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.delete('/creatives/:id', async (c) => {
  const ok = await adService.deleteAdCreative(c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
