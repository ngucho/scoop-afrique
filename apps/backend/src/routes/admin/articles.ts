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
import {
  createArticleBodySchema,
  importArticlesBodySchema,
  updateArticleBodySchema,
  type CreateArticleBody,
} from '../../schemas/article.js'
import * as articleService from '../../services/article.service.js'
import * as categoryService from '../../services/category.service.js'
import { config } from '../../config/env.js'
import type { AppEnv } from '../../types.js'

function requireDatabase(c: import('hono').Context) {
  if (!config.database) {
    return c.json(
      {
        error: 'Database not configured',
        code: 'CONFIG',
        hint: 'Set DATABASE_URL in the backend .env (pooler from Supabase Connect dialog)',
      },
      503
    )
  }
  return null
}

const app = new Hono<AppEnv>()

const ARTICLE_SORT_FIELDS = new Set(['title', 'status', 'category', 'author', 'views', 'published_at', 'updated_at'])

function articleSortField(raw: string | undefined): articleService.ListOptions['sortBy'] {
  return raw && ARTICLE_SORT_FIELDS.has(raw) ? raw as articleService.ListOptions['sortBy'] : 'published_at'
}

function sortDirection(raw: string | undefined): 'asc' | 'desc' {
  return raw === 'asc' ? 'asc' : 'desc'
}

function toAdminArticlePayload(a: articleService.ArticleWithAuthor) {
  const { reader_public_display_name: _r, ...rest } = a
  return rest
}

function readinessErrorResponse(c: import('hono').Context, err: unknown) {
  if (err instanceof articleService.ArticleReadinessError) {
    return c.json(
      {
        error: 'Article incomplet avant soumission ou publication',
        code: err.code,
        missing: err.missing,
      },
      400,
    )
  }
  return null
}

function normalizeCategoryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function textToTiptapDoc(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  return {
    type: 'doc',
    content: paragraphs.map((paragraph) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: paragraph.replace(/\s*\n\s*/g, ' ') }],
    })),
  }
}

// All admin routes require authentication
app.use('*', requireAuth)

/* --- List all articles (any status) --- */
app.get('/', async (c) => {
  const user = c.get('user')
  const status = c.req.query('status') as articleService.ArticleStatus | undefined
  const authorId = c.req.query('author_id') ?? undefined
  const q = c.req.query('q') ?? undefined
  const sortBy = articleSortField(c.req.query('sort'))
  const sortDir = sortDirection(c.req.query('dir'))
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)

  const { data, total } = await articleService.listArticles({
    status: status ?? undefined,
    authorId:
      user.role === 'journalist' ? user.id : authorId, // Journalists see only their own
    q,
    page,
    limit,
    sortBy,
    sortDir,
    allowAllStatuses: true,
  })
  return c.json({ data: data.map(toAdminArticlePayload), total })
})

/* --- Get single article --- */
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const article = await articleService.getArticleByIdOrSlug(id, false)
  if (!article) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: toAdminArticlePayload(article) })
})

/* --- Create article (journalist+) --- */
app.post(
  '/',
  requireRole('journalist', 'editor', 'manager', 'admin'),
  async (c) => {
    const dbErr = requireDatabase(c)
    if (dbErr) return dbErr

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
    if (!articleService.canCreateArticleWithStatus(user.role, parsed.data.status)) {
      return c.json(
        {
          error: 'Only editors can create a published article',
          code: 'FORBIDDEN_STATUS',
        },
        403,
      )
    }
    try {
      const article = await articleService.createArticle(parsed.data, user.id)
      return c.json({ data: article }, 201)
    } catch (err) {
      const readiness = readinessErrorResponse(c, err)
      if (readiness) return readiness
      throw err
    }
  }
)

/* --- Import JSON as drafts (journalist+) --- */
app.post(
  '/import',
  requireRole('journalist', 'editor', 'manager', 'admin'),
  async (c) => {
    const dbErr = requireDatabase(c)
    if (dbErr) return dbErr

    const user = c.get('user')
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
    }

    const parsed = importArticlesBodySchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        {
          error: 'Invalid import body',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten(),
        },
        400,
      )
    }

    const categories = await categoryService.listCategories()
    const categoriesByKey = new Map<string, string>()
    const categoryIds = new Set<string>()
    for (const category of categories) {
      categoryIds.add(category.id)
      categoriesByKey.set(normalizeCategoryKey(category.slug), category.id)
      categoriesByKey.set(normalizeCategoryKey(category.name), category.id)
    }

    const created: Array<{ id: string; title: string; category_id: string | null }> = []
    const needs_category_review: Array<{ index: number; title: string; requested_category: string | null }> = []

    for (const [index, item] of parsed.data.articles.entries()) {
      const requestedCategory =
        item.category_id || item.category_slug || item.category || item.rubrique || null
      const categoryId =
        (item.category_id && categoryIds.has(item.category_id) ? item.category_id : undefined) ??
        (requestedCategory ? categoriesByKey.get(normalizeCategoryKey(requestedCategory)) : undefined) ??
        null

      if (requestedCategory && !categoryId) {
        needs_category_review.push({
          index,
          title: item.title,
          requested_category: requestedCategory,
        })
      }

      const payload: CreateArticleBody = {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt ?? null,
        category_id: categoryId,
        content: item.content ?? textToTiptapDoc(item.body ?? ''),
        cover_image_url: item.cover_image_url ?? null,
        cover_image_credit: item.cover_image_credit ?? null,
        cover_image_source: item.cover_image_source ?? null,
        video_url: item.video_url ?? null,
        cover_video_credit: item.cover_video_credit ?? null,
        tags: item.tags ?? [],
        status: 'draft',
        meta_title: item.meta_title ?? null,
        meta_description: item.meta_description ?? null,
        og_image_url: item.og_image_url ?? null,
        scheduled_at: null,
        author_display_name: item.author_display_name,
      }
      const article = await articleService.createArticle(payload, user.id)
      created.push({ id: article.id, title: article.title, category_id: article.category_id })
    }

    return c.json(
      {
        data: {
          created,
          created_count: created.length,
          needs_category_review,
        },
      },
      201,
    )
  }
)

/* --- Update article --- */
app.patch('/:id', async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr

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
  let article: articleService.Article | null
  try {
    article = await articleService.updateArticle(
      id,
      parsed.data,
      user.id,
      user.role,
      { autosave: isAutosave }
    )
  } catch (err) {
    const readiness = readinessErrorResponse(c, err)
    if (readiness) return readiness
    throw err
  }
  if (!article) return c.json({ error: 'Not found or forbidden' }, 404)
  return c.json({ data: article })
})

/* --- Publish shortcut (editor+) — accepts optional body to persist latest content/title/excerpt --- */
app.post(
  '/:id/publish',
  requireRole('editor', 'manager', 'admin'),
  async (c) => {
    const dbErr = requireDatabase(c)
    if (dbErr) return dbErr

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
    let article: articleService.Article | null
    try {
      article = await articleService.updateArticle(
        id,
        payload,
        user.id,
        user.role,
        { createRevision: true }
      )
    } catch (err) {
      const readiness = readinessErrorResponse(c, err)
      if (readiness) return readiness
      throw err
    }
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
