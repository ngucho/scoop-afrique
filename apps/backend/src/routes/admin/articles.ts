/**
 * Admin article routes — CRUD with role-based access.
 * All routes require authentication.
 *
 * - GET    /           — list articles (all statuses)
 * - GET    /:id        — get single article
 * - POST   /           — create article (journalist+)
 * - PATCH  /:id        — update article (author or editor+)
 * - DELETE /:id        — delete article (manager+)
 * - POST   /:id/publish — shortcut to publish (editor+)
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { createArticleBodySchema, updateArticleBodySchema } from '../../schemas/article.js'
import * as articleService from '../../services/article.service.js'
import { config } from '../../config/env.js'
import type { AppEnv } from '../../types.js'

function requireSupabase(c: import('hono').Context) {
  if (!config.supabase) {
    return c.json(
      {
        error: 'Supabase not configured',
        code: 'CONFIG',
        hint: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the backend .env',
      },
      503
    )
  }
  return null
}

const app = new Hono<AppEnv>()

// All admin routes require authentication
app.use('*', requireAuth)

/* --- List all articles (any status) --- */
app.get('/', async (c) => {
  const user = c.get('user')
  const status = c.req.query('status') as articleService.ArticleStatus | undefined
  const authorId = c.req.query('author_id') ?? undefined
  const q = c.req.query('q') ?? undefined
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)

  const { data, total } = await articleService.listArticles({
    status: status ?? undefined,
    authorId:
      user.role === 'journalist' ? user.id : authorId, // Journalists see only their own
    q,
    page,
    limit,
    allowAllStatuses: true,
  })
  return c.json({ data, total })
})

/* --- Get single article --- */
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const article = await articleService.getArticleByIdOrSlug(id, false)
  if (!article) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: article })
})

/* --- Create article (journalist+) --- */
app.post(
  '/',
  requireRole('journalist', 'editor', 'manager', 'admin'),
  async (c) => {
    const supabaseErr = requireSupabase(c)
    if (supabaseErr) return supabaseErr

    const user = c.get('user')
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
    }
    const parsed = createArticleBodySchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        {
          error: 'Invalid body',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        },
        400
      )
    }
    const article = await articleService.createArticle(parsed.data, user.id)
    return c.json({ data: article }, 201)
  }
)

/* --- Update article --- */
app.patch('/:id', async (c) => {
  const supabaseErr = requireSupabase(c)
  if (supabaseErr) return supabaseErr

  const user = c.get('user')
  const id = c.req.param('id')
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
  }
  const parsed = updateArticleBodySchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const isAutosave = c.req.query('autosave') === '1'
  const article = await articleService.updateArticle(
    id,
    parsed.data,
    user.id,
    user.role,
    { autosave: isAutosave }
  )
  if (!article) return c.json({ error: 'Not found or forbidden' }, 404)
  return c.json({ data: article })
})

/* --- Publish shortcut (editor+) — accepts optional body to persist latest content/title/excerpt --- */
app.post(
  '/:id/publish',
  requireRole('editor', 'manager', 'admin'),
  async (c) => {
    const supabaseErr = requireSupabase(c)
    if (supabaseErr) return supabaseErr

    const user = c.get('user')
    const id = c.req.param('id')
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      body = {}
    }
    const parsed = updateArticleBodySchema.safeParse(body)
    const payload = parsed.success ? { status: 'published' as const, ...parsed.data } : { status: 'published' as const }
    const article = await articleService.updateArticle(
      id,
      payload,
      user.id,
      user.role,
      { createRevision: true }
    )
    if (!article) return c.json({ error: 'Not found or forbidden' }, 404)
    return c.json({ data: article })
  }
)

/* --- Delete article (manager+) --- */
app.delete(
  '/:id',
  requireRole('manager', 'admin'),
  async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const ok = await articleService.deleteArticle(id, user.role)
    if (!ok) return c.json({ error: 'Forbidden or not found' }, 403)
    return c.body(null, 204)
  }
)

export default app
