/**
 * Public announcements — active items only (date + is_active).
 */
import { Hono } from 'hono'
import * as announcementService from '../services/announcement.service.js'
import { config } from '../config/env.js'

const app = new Hono()

app.get('/', async (c) => {
  if (!config.database) return c.json({ data: [] })
  const data = await announcementService.listActiveAnnouncements()
  c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
  return c.json({ data })
})

export default app
