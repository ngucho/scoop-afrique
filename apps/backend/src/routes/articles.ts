/**
 * Public article routes.
 *
 * - GET /          — list published articles (search, category, tag, pagination)
 * - GET /:id       — get article by id or slug
 * - POST /:id/view — record a real browser view
 * - GET /:id/likes — like count + liked state
 * - POST /:id/likes — toggle like
 */
import { Hono } from 'hono'
import * as articleService from '../services/article.service.js'
import * as likeService from '../services/like.service.js'
import {
  getAuthUser,
  getOptionalAuthUser,
} from '../lib/auth.js'
import { config } from '../config/env.js'
import { normalizePublicSearchQuery } from '../lib/search-query.js'
import { honoRequestHeaders, isNotModified, setConditionalCacheHeaders, weakEtag } from '../lib/http-cache.js'

interface ArticlesAppDependencies {
  getAuthUser: typeof getAuthUser
  getOptionalAuthUser: typeof getOptionalAuthUser
  isDatabaseConfigured: () => boolean
  listReaderArticleHistoryIds: typeof articleService.listReaderArticleHistoryIds
  getRecommendedArticleForReader: typeof articleService.getRecommendedArticleForReader
}

export function createArticlesApp(
  overrides: Partial<ArticlesAppDependencies> = {},
) {
  const dependencies: ArticlesAppDependencies = {
    getAuthUser,
    getOptionalAuthUser,
    isDatabaseConfigured: () => config.database !== null,
    listReaderArticleHistoryIds: articleService.listReaderArticleHistoryIds,
    getRecommendedArticleForReader: articleService.getRecommendedArticleForReader,
    ...overrides,
  }
  const app = new Hono()

/* --- Most-read (hero fallback; no view increment) — must be before /:id --- */
app.get('/most-read', async (c) => {
  if (!config.database) return c.json({ data: [] })
  const hoursParam = Number(c.req.query('hours'))
  const hours = Number.isFinite(hoursParam) ? Math.min(Math.max(hoursParam, 1), 2160) : null
  const days = Math.min(Math.max(Number(c.req.query('days')) || 7, 1), 90)
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 8, 1), 15)
  const list = hours
    ? await articleService.getPublishedArticlesMostReadForHeroHours(hours, limit)
    : await articleService.getPublishedArticlesMostReadForHero(days, limit)
  const presented = list.map((a) => articleService.presentArticleCardForPublicApi(a))
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  return c.json({ data: presented })
})

/* --- Public author profile + publications --- */
app.get('/authors/:authorId', async (c) => {
  if (!config.database) return c.json({ error: 'Database not configured' }, 503)
  const author = await articleService.getPublicAuthorProfile(c.req.param('authorId'))
  if (!author) return c.json({ error: 'Not found' }, 404)
  c.header('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
  return c.json({ data: author })
})

app.get('/authors/:authorId/articles', async (c) => {
  if (!config.database) return c.json({ data: [], total: 0 })
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const { data, total } = await articleService.listPublicArticleCards({
    authorId: c.req.param('authorId'),
    page,
    limit,
  })
  const presented = data.map((a) => articleService.presentArticleCardForPublicApi(a))
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  return c.json({ data: presented, total, page, limit })
})

/* --- Reader recommendation (uses current article + optional local history ids) --- */
app.get('/recommendations/:id', async (c) => {
  if (!dependencies.isDatabaseConfigured()) return c.json({ data: null })
  const user = await dependencies.getOptionalAuthUser(c)
  const localHistory = (c.req.query('history') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 30)
  const accountHistory = user
    ? await dependencies.listReaderArticleHistoryIds(user.id, 30)
    : []
  const history = Array.from(new Set([...accountHistory, ...localHistory])).slice(0, 40)
  const article = await dependencies.getRecommendedArticleForReader(
    c.req.param('id'),
    history,
  )
  c.header('Cache-Control', 'private, max-age=60')
  return c.json({ data: article })
})

app.post('/history', async (c) => {
  if (!dependencies.isDatabaseConfigured()) {
    return c.json({ error: 'Database not configured' }, 503)
  }
  const authResult = await dependencies.getAuthUser(c)
  if (!authResult.ok) {
    if (authResult.reason === 'AUTH_PROVIDER_UNAVAILABLE') {
      return c.json(
        {
          error: 'Authentication provider unavailable',
          code: authResult.reason,
        },
        503,
      )
    }
    return c.json(
      { error: 'Unauthorized', code: 'INVALID_TOKEN' },
      401,
    )
  }
  const user = authResult.user
  const body = await c.req.json().catch(() => ({}))
  const articleId = typeof body?.article_id === 'string' ? body.article_id : ''
  if (!articleId) return c.json({ error: 'article_id required' }, 400)
  await articleService.recordReaderArticleHistory(user.id, articleId)
  return c.json({ data: { ok: true } })
})

app.post('/:id/audio-access', async (c) => {
  if (!config.database) return c.json({ data: { available: false, audio_url: null } })
  const id = c.req.param('id')
  const article = await articleService.getArticleByIdOrSlug(id, true)
  if (!article) return c.json({ error: 'Not found' }, 404)
  const result = await articleService.markArticleAudioAccess(article.id)
  c.header('Cache-Control', 'no-store')
  return c.json({ data: result })
})

app.post('/:id/view', async (c) => {
  if (!config.database) return c.json({ data: { recorded: false } }, 503)
  const article = await articleService.getArticleByIdOrSlug(c.req.param('id'), true)
  if (!article || article.status !== 'published') return c.json({ error: 'Not found' }, 404)

  const user = await dependencies.getOptionalAuthUser(c)
  const body = await c.req.json().catch(() => ({}))
  const anonymousId = typeof body?.visitor_id === 'string' ? body.visitor_id.trim() : ''
  if (!user && !/^[a-zA-Z0-9_-]{16,128}$/.test(anonymousId)) {
    return c.json({ error: 'visitor_id required' }, 400)
  }

  const visitorKey = user ? `account:${user.id}` : `anonymous:${anonymousId}`
  const recorded = await articleService.recordArticleView(article.id, visitorKey)
  c.header('Cache-Control', 'no-store')
  return c.json({ data: { recorded } }, recorded ? 201 : 200)
})

/* --- List published articles --- */
app.get('/', async (c) => {
  if (!config.database) return c.json({ data: [], total: 0 })
  const category = c.req.query('category')
  const q = normalizePublicSearchQuery(c.req.query('q'))
  const tag = c.req.query('tag')
  const cursor = c.req.query('cursor')
  const useCursor = cursor !== undefined || c.req.query('pagination') === 'cursor'
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  if (useCursor) {
    const { data, next_cursor } = await articleService.listPublicArticleCardsCursor({
      category: category || undefined,
      q: q || undefined,
      tag: tag || undefined,
      cursor,
      limit,
    })
    const presented = data.map((a) => articleService.presentArticleCardForPublicApi(a))
    c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
    return c.json({ data: presented, next_cursor, limit })
  }
  const { data, total } = await articleService.listPublicArticleCards({
    category: category || undefined,
    q: q || undefined,
    tag: tag || undefined,
    page,
    limit,
  })
  const presented = data.map((a) => articleService.presentArticleCardForPublicApi(a))
  // Cache article lists for 30s, serve stale for 5 min while revalidating
  c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  return c.json({ data: presented, total, page, limit })
})

/* --- Get single article --- */
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await dependencies.getOptionalAuthUser(c)
  const onlyPublished = !user
  const article = await articleService.getArticleByIdOrSlug(id, onlyPublished)
  if (!article) return c.json({ error: 'Not found' }, 404)

  if (article.status === 'published' && !articleService.isArticleAudioFresh(article)) {
    articleService.enqueueArticleAudioJob(article.id, article.audio_url ? 'manual' : 'published').catch(() => {})
  }

  const cacheMetadata = {
    etag: weakEtag(['article', article.id, article.version, article.updated_at]),
    lastModified: new Date(article.updated_at).toUTCString(),
    cacheControl: 'public, max-age=60, stale-while-revalidate=600',
  }
  setConditionalCacheHeaders(c, cacheMetadata)
  if (isNotModified(honoRequestHeaders(c), cacheMetadata)) return c.body(null, 304)
  return c.json({ data: articleService.presentArticleForPublicApi(article) })
})

/* --- Like count + liked state --- */
app.get('/:id/likes', async (c) => {
  const id = c.req.param('id')
  const user = await dependencies.getOptionalAuthUser(c)
  const anonymousId = c.req.query('anonymous_id') ?? null
  const count = await likeService.getLikeCount(id)
  const liked = user
    ? await likeService.hasLiked(id, user.id, null)
    : anonymousId
      ? await likeService.hasLiked(id, null, anonymousId)
      : false
  return c.json({ data: { count, liked } })
})

/* --- Toggle like --- */
app.post('/:id/likes', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const anonymousId =
    typeof body?.anonymous_id === 'string' ? body.anonymous_id : null
  const user = await dependencies.getOptionalAuthUser(c)
  const result = await likeService.toggleLike(
    id,
    user?.id ?? null,
    anonymousId
  )
  return c.json({ data: result })
})

  return app
}

export default createArticlesApp()
