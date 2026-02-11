/**
 * Public comment routes.
 * - GET  /articles/:articleId/comments — list approved comments
 * - POST /articles/:articleId/comments — create comment (auth required, pending)
 * - PATCH /:id                         — edit own comment (auth required)
 * - DELETE /:id                        — delete own comment (auth) or admin
 */
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { createCommentBodySchema, updateCommentBodySchema } from '../schemas/comment.js'
import * as commentService from '../services/comment.service.js'
import type { AppEnv } from '../types.js'

const app = new Hono<AppEnv>()

/* --- List approved comments for an article (public) --- */
app.get('/articles/:articleId/comments', async (c) => {
  const articleId = c.req.param('articleId')
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100)
  const { data, total } = await commentService.listArticleComments(articleId, { page, limit })
  return c.json({ data, total })
})

/* --- Create a comment (auth required) --- */
app.post('/articles/:articleId/comments', requireAuth, async (c) => {
  const user = c.get('user')
  const articleId = c.req.param('articleId')
  const parsed = createCommentBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const comment = await commentService.createComment(
    articleId,
    user.id,
    parsed.data.body,
    parsed.data.parent_id ?? null
  )
  return c.json({ data: comment }, 201)
})

/* --- Edit own comment --- */
app.patch('/comments/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const parsed = updateCommentBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success || !parsed.data.body) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR' }, 400)
  }
  const comment = await commentService.updateComment(id, user.id, parsed.data.body)
  if (!comment) return c.json({ error: 'Not found or forbidden' }, 404)
  return c.json({ data: comment })
})

/* --- Delete own comment (or admin) --- */
app.delete('/comments/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const ok = await commentService.deleteComment(id, user.id, user.role)
  if (!ok) return c.json({ error: 'Not found or forbidden' }, 404)
  return c.body(null, 204)
})

export default app
