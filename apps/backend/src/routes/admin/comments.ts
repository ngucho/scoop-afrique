/**
 * Admin comment routes — moderation.
 *
 * - GET   /       — list all comments (any status, paginated)
 * - PATCH /:id    — moderate comment (approve/reject)
 * - DELETE /:id   — delete comment
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { moderateCommentBodySchema } from '../../schemas/comment.js'
import * as commentService from '../../services/comment.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth)
app.use('*', requireRole('editor', 'manager', 'admin'))

/* --- List all comments --- */
app.get('/', async (c) => {
  const status = c.req.query('status') as commentService.CommentStatus | undefined
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const { data, total } = await commentService.listAllComments({ status, page, limit })
  return c.json({ data, total })
})

/* --- Moderate comment --- */
app.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const parsed = moderateCommentBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR' }, 400)
  }
  const comment = await commentService.moderateComment(id, parsed.data.status)
  if (!comment) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: comment })
})

/* --- Delete comment --- */
app.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const ok = await commentService.deleteComment(id, user.id, user.role)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
