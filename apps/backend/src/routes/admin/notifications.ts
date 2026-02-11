/**
 * Admin notifications — comment alerts for article owners.
 *
 * - GET / — list notifications for current user (editorial + reader comments on their articles)
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import * as notificationService from '../../services/notification.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth, requireRole('journalist', 'editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const user = c.get('user')
  const data = await notificationService.getNotificationsForUser(user.id)
  return c.json({ data })
})

export default app
