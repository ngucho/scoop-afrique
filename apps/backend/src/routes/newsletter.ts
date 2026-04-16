import { Hono } from 'hono'
import { subscribeBodySchema, unsubscribeBodySchema } from '../schemas/newsletter.js'
import * as newsletterService from '../services/newsletter.service.js'
import { config } from '../config/env.js'

const app = new Hono()

function readerSiteBase(): string {
  return config.publicSiteUrl?.replace(/\/+$/, '') ?? 'https://www.scoop-afrique.com'
}

app.post('/subscribe', async (c) => {
  const parsed = subscribeBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid email', code: 'VALIDATION_ERROR' }, 400)
  }
  const result = await newsletterService.subscribe(parsed.data.email)
  return c.json({ data: result })
})

app.post('/unsubscribe', async (c) => {
  const parsed = unsubscribeBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'token or email required', code: 'VALIDATION_ERROR' }, 400)
  }
  const ok = parsed.data.token
    ? await newsletterService.unsubscribeByToken(parsed.data.token)
    : parsed.data.email
      ? await newsletterService.unsubscribeByEmail(parsed.data.email)
      : false
  return c.json({ data: { success: ok } })
})

app.get('/confirm', async (c) => {
  const token = c.req.query('token')
  if (!token) return c.json({ error: 'token required' }, 400)
  const ok = await newsletterService.confirmSubscription(token)
  return c.json({ data: { success: ok } })
})

/** One-click unsubscribe from weekly newsletter (link in digest emails). */
app.get('/unsubscribe', async (c) => {
  const token = c.req.query('token')
  if (!token) return c.json({ error: 'token required' }, 400)
  const ok = await newsletterService.unsubscribeByListToken(token)
  const base = readerSiteBase()
  if (ok) return c.redirect(`${base}/newsletter?unsubscribed=1`, 302)
  return c.redirect(`${base}/newsletter?unsubscribed=invalid`, 302)
})

export default app
