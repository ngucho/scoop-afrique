/**
 * Article collaborator routes — manage co-editing access.
 *
 * Mounted at: /admin/articles/:articleId/collaborators
 *
 * - GET    /          — list collaborators
 * - POST   /          — add collaborator (by email)
 * - DELETE /:userId   — remove collaborator
 */
import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import * as collabService from '../../services/collaborator.service.js'
import type { AppEnv } from '../../types.js'
import { z } from 'zod'

const addCollabSchema = z.object({
  email: z.string().email(),
  role: z.enum(['contributor', 'co_author']).default('contributor'),
})

const app = new Hono<AppEnv>()

app.use('*', requireAuth)

/* List collaborators */
app.get('/:articleId/collaborators', async (c) => {
  const articleId = c.req.param('articleId')
  const collabs = await collabService.listCollaborators(articleId)
  return c.json({ data: collabs })
})

/* Add collaborator by email */
app.post('/:articleId/collaborators', async (c) => {
  const user = c.get('user')
  const articleId = c.req.param('articleId')

  // Only author, editor+, or existing collaborator can add others
  const canEdit = await collabService.canEditArticle(articleId, user.id, user.role)
  if (!canEdit) return c.json({ error: 'Forbidden' }, 403)

  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }
  const parsed = addCollabSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)

  const targetProfileId = await collabService.findProfileByEmail(parsed.data.email)
  if (!targetProfileId) return c.json({ error: 'User not found' }, 404)

  const collab = await collabService.addCollaborator(
    articleId,
    targetProfileId,
    parsed.data.role,
    user.id,
  )
  return c.json({ data: collab }, 201)
})

/* Remove collaborator */
app.delete('/:articleId/collaborators/:userId', async (c) => {
  const user = c.get('user')
  const articleId = c.req.param('articleId')
  const targetUserId = c.req.param('userId')

  // Only author, editor+, or the collaborator themselves can remove
  const canEdit = await collabService.canEditArticle(articleId, user.id, user.role)
  if (!canEdit && user.id !== targetUserId) return c.json({ error: 'Forbidden' }, 403)

  const ok = await collabService.removeCollaborator(articleId, targetUserId)
  if (!ok) return c.json({ error: 'Failed to remove' }, 400)
  return c.body(null, 204)
})

export default app
