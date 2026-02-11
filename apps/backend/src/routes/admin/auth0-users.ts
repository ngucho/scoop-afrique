/**
 * Admin route to list users from Auth0 (for adding to team or as collaborators).
 *
 * - GET / — list users from Auth0 Management API (editor+)
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { listAuth0Users } from '../../lib/auth0-management.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth)
app.use('*', requireRole('editor', 'manager', 'admin'))

app.get('/', async (c) => {
  const page = Math.max(0, Number(c.req.query('page')) || 0)
  const perPage = Math.min(100, Math.max(1, Number(c.req.query('per_page')) || 50))
  const { users, total } = await listAuth0Users(page, perPage)
  return c.json({ data: users, total })
})

export default app
