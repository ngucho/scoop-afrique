/**
 * Admin announcements — full CRUD (manager+).
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createAnnouncementBodySchema, updateAnnouncementBodySchema } from '../../schemas/announcements.js'
import * as announcementService from '../../services/announcement.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth, requireRole('manager', 'admin'))

app.get('/', async (c) => {
  const data = await announcementService.listAnnouncementsAdmin()
  return c.json({ data })
})

app.post('/', async (c) => {
  const parsed = createAnnouncementBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await announcementService.createAnnouncement(parsed.data)
  return c.json({ data }, 201)
})

app.get('/:id', async (c) => {
  const data = await announcementService.getAnnouncementById(c.req.param('id'))
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.patch('/:id', async (c) => {
  const parsed = updateAnnouncementBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const data = await announcementService.updateAnnouncement(c.req.param('id'), parsed.data)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json({ data })
})

app.delete('/:id', async (c) => {
  const ok = await announcementService.deleteAnnouncement(c.req.param('id'))
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
