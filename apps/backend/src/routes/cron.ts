import { Hono } from 'hono'
import { config } from '../config/env.js'
import { isAuthorizedCronRequest } from '../lib/cron-auth.js'
import { runNewsletterWeeklyDigest } from '../services/digest.service.js'
import { resendPendingConfirmations } from '../services/newsletter.service.js'

const app = new Hono()

function requireCronAuthorization(c: import('hono').Context) {
  if (!config.digestCronSecret) {
    return c.json(
      {
        error: 'Cron secret not configured',
        code: 'CONFIG',
        hint: 'Set CRON_SECRET in Vercel environment variables.',
      },
      503,
    )
  }
  if (!isAuthorizedCronRequest(c.req.header('authorization'), config.digestCronSecret)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  if (!config.database) {
    return c.json({ error: 'Database not configured', code: 'CONFIG' }, 503)
  }
  return null
}

app.get('/newsletter-weekly-digest/friday-afternoon', async (c) => {
  const authErr = requireCronAuthorization(c)
  if (authErr) return authErr
  const result = await runNewsletterWeeklyDigest({ dryRun: false, excludeIds: [] })
  return c.json({ data: { slot: 'friday_afternoon', ...result } })
})

app.get('/newsletter-weekly-digest/saturday-morning', async (c) => {
  const authErr = requireCronAuthorization(c)
  if (authErr) return authErr
  const result = await runNewsletterWeeklyDigest({ dryRun: false, excludeIds: [] })
  return c.json({ data: { slot: 'saturday_morning', ...result } })
})

app.get('/subscribers/pending-relaunch', async (c) => {
  const authErr = requireCronAuthorization(c)
  if (authErr) return authErr
  const result = await resendPendingConfirmations(250)
  return c.json({ data: result })
})

export default app
