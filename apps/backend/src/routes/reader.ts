/**
 * Authenticated reader (subscriber) account — Auth0 reader SPA token only.
 */
import { Hono } from 'hono'
import { requireReaderAuth } from '../middleware/reader-auth.js'
import { updateReaderAccountBodySchema } from '../schemas/reader.js'
import * as readerSubscriberService from '../services/reader-subscriber.service.js'

const app = new Hono()

app.use('*', requireReaderAuth)

app.get('/me', async (c) => {
  const reader = c.get('reader' as never) as { sub: string; email: string }
  const row = await readerSubscriberService.getOrCreateReaderSubscriber(reader.sub, reader.email)
  return c.json({ data: row })
})

app.patch('/me', async (c) => {
  const reader = c.get('reader' as never) as { sub: string; email: string }
  await readerSubscriberService.getOrCreateReaderSubscriber(reader.sub, reader.email)

  const parsed = updateReaderAccountBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const updated = await readerSubscriberService.updateReaderSubscriber(reader.sub, {
    topicCategoryIds: parsed.data.topic_category_ids,
    digestFrequency: parsed.data.digest_frequency,
  })
  if (!updated) {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json({ data: updated })
})

export default app
