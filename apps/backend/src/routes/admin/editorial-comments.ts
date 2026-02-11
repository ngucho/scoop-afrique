/**
 * Editorial comment routes — internal staff feedback on articles.
 *
 * Mounted at: /admin/articles/:articleId/editorial-comments
 *
 * - GET    /             — list editorial comments
 * - POST   /             — add comment
 * - PATCH  /:commentId   — resolve comment
 * - DELETE /:commentId   — delete comment
 */
import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import * as commentService from '../../services/editorial-comment.service.js'
import type { AppEnv } from '../../types.js'
import { z } from 'zod'

const addCommentSchema = z.object({
  body: z.string().min(1).max(5000),
})

const app = new Hono<AppEnv>()

app.use('*', requireAuth)

/* List editorial comments */
app.get('/:articleId/editorial-comments', async (c) => {
  const articleId = c.req.param('articleId')
  const includeResolved = c.req.query('include_resolved') === '1'
  const comments = await commentService.listEditorialComments(articleId, includeResolved)
  const unresolved = await commentService.countUnresolved(articleId)
  return c.json({ data: comments, unresolved_count: unresolved })
})

/* Add editorial comment */
app.post('/:articleId/editorial-comments', async (c) => {
  const user = c.get('user')
  const articleId = c.req.param('articleId')

  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }
  const parsed = addCommentSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)

  const comment = await commentService.addEditorialComment(articleId, user.id, parsed.data.body)
  return c.json({ data: comment }, 201)
})

/* Resolve editorial comment */
app.patch('/:articleId/editorial-comments/:commentId', async (c) => {
  const commentId = c.req.param('commentId')
  const comment = await commentService.resolveEditorialComment(commentId)
  if (!comment) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: comment })
})

/* Delete editorial comment */
app.delete('/:articleId/editorial-comments/:commentId', async (c) => {
  const user = c.get('user')
  const commentId = c.req.param('commentId')
  const ok = await commentService.deleteEditorialComment(commentId, user.id, user.role)
  if (!ok) return c.json({ error: 'Forbidden or not found' }, 403)
  return c.body(null, 204)
})

export default app
