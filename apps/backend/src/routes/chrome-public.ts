/**
 * Public reader chrome copy (emplacements pub vides, etc.).
 */
import { Hono } from 'hono'
import { config } from '../config/env.js'
import * as chromeSettings from '../services/chrome-settings.service.js'

const app = new Hono()

app.get('/', async (c) => {
  if (!config.database) {
    return c.json({ data: { empty_ad: { title: null, subtitle: null } } })
  }
  const empty_ad = await chromeSettings.getPublicChromeFallbackCopy()
  c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
  return c.json({ data: { empty_ad } })
})

export default app
