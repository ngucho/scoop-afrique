/**
 * Digest cron, Resend webhooks, one-click unsubscribe.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { config } from '../config/env.js'
import { digestFrequencySchema } from '../schemas/reader.js'
import * as digestService from '../services/digest.service.js'
import * as readerSubscriberService from '../services/reader-subscriber.service.js'

const app = new Hono()

const runBodySchema = z.object({
  frequency: digestFrequencySchema,
  dry_run: z.boolean().optional(),
})

function siteBase(): string {
  return config.publicSiteUrl?.replace(/\/+$/, '') ?? 'https://www.scoop-afrique.com'
}

/** Protected cron trigger (Vercel cron, GitHub Actions, etc.) */
app.post('/run', async (c) => {
  const secret = c.req.header('x-digest-cron-secret')
  if (!config.digestCronSecret || secret !== config.digestCronSecret) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const parsed = runBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)
  }

  if (parsed.data.frequency === 'off') {
    return c.json({ error: 'frequency cannot be off' }, 400)
  }

  const result = await digestService.runDigestJob({
    frequency: parsed.data.frequency,
    dryRun: parsed.data.dry_run,
  })
  return c.json({ data: result })
})

/** Resend webhook — raw body required for Svix verification */
app.post('/webhooks/resend', async (c) => {
  if (!config.resend?.webhookSecret) {
    return c.json({ error: 'Webhook not configured' }, 503)
  }

  const payload = await c.req.text()
  const svixId = c.req.header('svix-id')
  const svixTimestamp = c.req.header('svix-timestamp')
  const svixSignature = c.req.header('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing Svix headers' }, 400)
  }

  let evt: { type?: string; data?: { email_id?: string; id?: string } } = {}
  try {
    const expectedSecret = config.resend.webhookSecret
    if (!expectedSecret || svixSignature !== expectedSecret) {
      return c.json({ error: 'Invalid signature' }, 400)
    }
    evt = JSON.parse(payload) as { type?: string; data?: { email_id?: string; id?: string } }
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  const type = evt.type ?? ''
  const data = evt.data as { email_id?: string; id?: string } | undefined
  const messageId = data?.email_id ?? data?.id
  if (messageId && type.startsWith('email.')) {
    await digestService.updateEmailStatusFromWebhook(messageId, type)
  }

  return c.json({ received: true })
})

/** One-click unsubscribe (GET from email clients) */
app.get('/unsubscribe', async (c) => {
  const token = c.req.query('t')
  if (!token) {
    return c.text('Missing token', 400)
  }
  const ok = await readerSubscriberService.unsubscribeReaderByToken(token)
  const base = siteBase()
  if (ok) {
    return c.redirect(`${base}/account?digest=unsubscribed`, 302)
  }
  return c.redirect(`${base}/account?digest=unsubscribe_invalid`, 302)
})

export default app
