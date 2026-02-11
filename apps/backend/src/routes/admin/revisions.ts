/**
 * Article revision routes — version history and rollback.
 *
 * Mounted at: /admin/articles/:articleId/revisions
 *
 * - GET  /              — list revisions
 * - GET  /:version      — get specific revision
 * - POST /:version/restore — restore to a version
 */
import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import * as revisionService from '../../services/revision.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth)

/* List revisions for an article */
app.get('/:articleId/revisions', async (c) => {
  const articleId = c.req.param('articleId')
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const { data, total } = await revisionService.listRevisions(articleId, page, limit)
  return c.json({ data, total })
})

/* Get a specific revision */
app.get('/:articleId/revisions/:version', async (c) => {
  const articleId = c.req.param('articleId')
  const version = Number(c.req.param('version'))
  if (Number.isNaN(version)) return c.json({ error: 'Invalid version' }, 400)
  const rev = await revisionService.getRevision(articleId, version)
  if (!rev) return c.json({ error: 'Revision not found' }, 404)
  return c.json({ data: rev })
})

/* Restore a revision */
app.post('/:articleId/revisions/:version/restore', async (c) => {
  const user = c.get('user')
  const articleId = c.req.param('articleId')
  const version = Number(c.req.param('version'))
  if (Number.isNaN(version)) return c.json({ error: 'Invalid version' }, 400)
  const rev = await revisionService.restoreRevision(articleId, version, user.id)
  if (!rev) return c.json({ error: 'Revision not found' }, 404)
  return c.json({ data: rev })
})

export default app
