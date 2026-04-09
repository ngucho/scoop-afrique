/**
 * Admin digest & newsletter campaigns — enqueue jobs, manage campaigns (manager+).
 */
import { Hono } from 'hono'
import {
  createNewsletterCampaignBodySchema,
  enqueueDigestBodySchema,
  updateNewsletterCampaignBodySchema,
} from '../../schemas/digest.js'
import * as digestService from '../../services/digest.service.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth, requireRole('manager', 'admin'))

app.get('/jobs', async (c) => {
  const limit = Number(c.req.query('limit')) || 50
  const data = await digestService.listDigestJobs(limit)
  return c.json({ data })
})

app.post('/enqueue', async (c) => {
  const parsed = enqueueDigestBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const scheduledFor = parsed.data.scheduled_for ? new Date(parsed.data.scheduled_for) : undefined
  const data = await digestService.enqueueDigestJob({
    frequency: parsed.data.frequency,
    campaign_id: parsed.data.campaign_id,
    scheduled_for: scheduledFor,
    send_now: parsed.data.send_now,
  })
  return c.json({ data }, 201)
})

app.get('/campaigns', async (c) => {
  const data = await digestService.listNewsletterCampaigns()
  return c.json({ data })
})

app.post('/campaigns', async (c) => {
  const parsed = createNewsletterCampaignBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await digestService.createNewsletterCampaign(parsed.data)
  return c.json({ data }, 201)
})

app.patch('/campaigns/:id', async (c) => {
  const parsed = updateNewsletterCampaignBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await digestService.updateNewsletterCampaign(c.req.param('id'), parsed.data)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.delete('/campaigns/:id', async (c) => {
  const ok = await digestService.deleteNewsletterCampaign(c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
