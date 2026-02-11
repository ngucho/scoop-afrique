/**
 * Article lock routes — pessimistic lock management.
 *
 * Mounted at: /admin/articles/:articleId/lock
 *
 * - POST   /   — acquire lock
 * - PATCH  /   — renew lock (heartbeat)
 * - DELETE /   — release lock
 * - GET    /   — get lock status
 */
import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import * as lockService from '../../services/lock.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth)

/* Acquire lock */
app.post('/:articleId/lock', async (c) => {
  const user = c.get('user')
  const articleId = c.req.param('articleId')
  const result = await lockService.acquireLock(articleId, user.id)
  if (result.acquired) {
    return c.json({ data: result.lock, acquired: true }, 200)
  }
  return c.json({ data: result.lock, acquired: false, message: `Locked by ${result.lock.locker_email ?? 'another user'}` }, 423)
})

/* Renew lock (heartbeat) */
app.patch('/:articleId/lock', async (c) => {
  const user = c.get('user')
  const articleId = c.req.param('articleId')
  const lock = await lockService.renewLock(articleId, user.id)
  if (!lock) return c.json({ error: 'Lock not held by you' }, 403)
  return c.json({ data: lock })
})

/* Release lock */
app.delete('/:articleId/lock', async (c) => {
  const user = c.get('user')
  const articleId = c.req.param('articleId')
  const ok = await lockService.releaseLock(articleId, user.id)
  if (!ok) return c.json({ error: 'Lock not held by you' }, 403)
  return c.body(null, 204)
})

/* Get lock status */
app.get('/:articleId/lock', async (c) => {
  const articleId = c.req.param('articleId')
  const lock = await lockService.getLock(articleId)
  return c.json({ data: lock })
})

export default app
