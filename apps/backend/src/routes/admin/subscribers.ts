/**
 * Admin subscriber segments & profiles (manager+).
 */
import { Hono } from 'hono'
import {
  createSubscriberProfileBodySchema,
  createSubscriberSegmentBodySchema,
  updateSubscriberProfileBodySchema,
  updateSubscriberSegmentBodySchema,
  upsertSubscriberPreferencesBodySchema,
} from '../../schemas/subscribers.js'
import * as subscriberService from '../../services/subscriber.service.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth, requireRole('manager', 'admin'))

/* --- Segments --- */
app.get('/segments', async (c) => {
  const data = await subscriberService.listSegments()
  return c.json({ data })
})

app.post('/segments', async (c) => {
  const parsed = createSubscriberSegmentBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await subscriberService.createSegment(parsed.data)
  return c.json({ data }, 201)
})

app.patch('/segments/:id', async (c) => {
  const parsed = updateSubscriberSegmentBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await subscriberService.updateSegment(c.req.param('id'), parsed.data)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.delete('/segments/:id', async (c) => {
  const ok = await subscriberService.deleteSegment(c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

/* --- Profiles --- */
app.get('/profiles', async (c) => {
  const data = await subscriberService.listProfiles()
  return c.json({ data })
})

app.post('/profiles', async (c) => {
  const parsed = createSubscriberProfileBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await subscriberService.createProfile(parsed.data)
  return c.json({ data }, 201)
})

app.get('/profiles/:id', async (c) => {
  const data = await subscriberService.getProfileById(c.req.param('id'))
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.patch('/profiles/:id', async (c) => {
  const parsed = updateSubscriberProfileBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await subscriberService.updateProfile(c.req.param('id'), parsed.data)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.delete('/profiles/:id', async (c) => {
  const ok = await subscriberService.deleteProfile(c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

app.put('/profiles/:id/preferences', async (c) => {
  const parsed = upsertSubscriberPreferencesBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const row = await subscriberService.upsertPreferences(c.req.param('id'), parsed.data)
  return c.json({
    data: {
      id: row.id,
      subscriber_profile_id: row.subscriberProfileId,
      frequency: row.frequency,
      category_ids: row.categoryIds,
      updated_at: row.updatedAt.toISOString(),
    },
  })
})

export default app
