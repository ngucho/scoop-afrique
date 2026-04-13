/**
 * Writer API — articles en brouillon (automatisation LLM). Pas de publication ici.
 */
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { requireWriterApiKey, type WriterEnv } from '../middleware/writer-api-key.js'
import { writerCreateArticleBodySchema, writerUpdateArticleBodySchema, bodyTextToTipTapDoc } from '../schemas/writer-article.js'
import * as articleService from '../services/article.service.js'
import { getDb } from '../db/index.js'
import { articles } from '../db/schema.js'
import { config } from '../config/env.js'

const app = new Hono<WriterEnv>()

app.use('*', requireWriterApiKey)

function requireDatabase(c: import('hono').Context) {
  if (!config.database) {
    return c.json({ error: 'Database not configured', code: 'CONFIG' }, 503)
  }
  return null
}

app.post('/articles', async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr

  const profileId = c.get('writerProfileId')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
  }

  const parsed = writerCreateArticleBodySchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      400,
    )
  }

  const { body_text, ...rest } = parsed.data
  const content =
    body_text != null && body_text.trim() !== ''
      ? bodyTextToTipTapDoc(body_text.trim())
      : rest.content

  const resolvedAuthor =
    rest.author_display_name?.trim() ||
    (await articleService.getDefaultAuthorDisplayForProfile(profileId)) ||
    null

  const article = await articleService.createArticle(
    {
      ...rest,
      content,
      status: 'draft',
      author_display_name: resolvedAuthor ?? undefined,
    },
    profileId,
  )
  return c.json({ data: article }, 201)
})

app.patch('/articles/:id', async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr

  const profileId = c.get('writerProfileId')
  const id = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
  }

  const parsed = writerUpdateArticleBodySchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      400,
    )
  }

  const db = getDb()
  const [existing] = await db
    .select({ authorId: articles.authorId, status: articles.status })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)
  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.authorId !== profileId) {
    return c.json({ error: 'Vous ne pouvez modifier que vos propres articles.', code: 'FORBIDDEN' }, 403)
  }
  if (existing.status === 'published') {
    return c.json(
      {
        error: 'Les articles publiés ne peuvent pas être modifiés via l’API Writer. Utilisez le backoffice.',
        code: 'PUBLISHED_LOCKED',
      },
      403,
    )
  }

  if (parsed.data.status !== undefined && parsed.data.status !== 'draft' && parsed.data.status !== 'review') {
    return c.json(
      {
        error:
          'Statut non autorisé via l’API Writer. Seuls draft et review sont acceptés ; la publication se fait dans le backoffice.',
        code: 'STATUS_NOT_ALLOWED',
      },
      400,
    )
  }

  const { body_text, ...patch } = parsed.data
  const payload =
    body_text != null && body_text.trim() !== ''
      ? { ...patch, content: bodyTextToTipTapDoc(body_text.trim()) }
      : patch

  const updated = await articleService.updateArticle(id, payload, profileId, 'journalist', {
    autosave: false,
  })
  if (!updated) return c.json({ error: 'Update failed' }, 400)
  return c.json({ data: updated })
})

export default app
