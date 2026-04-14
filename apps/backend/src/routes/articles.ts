/**
 * Public article routes.
 *
 * - GET /          — list published articles (search, category, tag, pagination)
 * - GET /:id       — get article by id or slug (increments view count)
 * - GET /:id/likes — like count + liked state
 * - POST /:id/likes — toggle like
 */
import { Hono } from 'hono'
import * as articleService from '../services/article.service.js'
import * as likeService from '../services/like.service.js'
import { getAuthUser } from '../lib/auth.js'
import { config } from '../config/env.js'
import { normalizePublicSearchQuery } from '../lib/search-query.js'

const app = new Hono()

/* --- Most-read (hero fallback; no view increment) — must be before /:id --- */
app.get('/most-read', async (c) => {
  if (!config.database) return c.json({ data: [] })
  const days = Math.min(Math.max(Number(c.req.query('days')) || 7, 1), 90)
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 8, 1), 15)
  const list = await articleService.getPublishedArticlesMostReadForHero(days, limit)
  const presented = list.map((a) => articleService.presentArticleForPublicApi(a))
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  return c.json({ data: presented })
})

/* --- List published articles --- */
app.get('/', async (c) => {
  if (!config.database) return c.json({ data: [], total: 0 })
  const category = c.req.query('category')
  const q = normalizePublicSearchQuery(c.req.query('q'))
  const tag = c.req.query('tag')
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
  const { data, total } = await articleService.listArticles({
    category: category || undefined,
    q: q || undefined,
    tag: tag || undefined,
    page,
    limit,
    status: 'published',
  })
  const presented = data.map((a) => articleService.presentArticleForPublicApi(a))
  // Cache article lists for 30s, serve stale for 5 min while revalidating
  c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  return c.json({ data: presented, total, page, limit })
})

/* --- Get single article (view tracking) --- */
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await getAuthUser(c)
  const onlyPublished = !user
  const article = await articleService.getArticleByIdOrSlug(id, onlyPublished)
  if (!article) return c.json({ error: 'Not found' }, 404)

  // Fire-and-forget view count increment for published articles (skip for server-side embeds, e.g. homepage hero)
  const trackRaw = c.req.query('track_view')
  const track = trackRaw !== '0' && trackRaw !== 'false'
  if (track && article.status === 'published') {
    articleService.incrementViewCount(article.id).catch(() => {})
  }

  // Cache single articles for 60s, stale for 10 min
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  return c.json({ data: articleService.presentArticleForPublicApi(article) })
})

/* --- Like count + liked state --- */
app.get('/:id/likes', async (c) => {
  const id = c.req.param('id')
  const user = await getAuthUser(c)
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
  const user = await getAuthUser(c)
  const result = await likeService.toggleLike(
    id,
    user?.id ?? null,
    anonymousId
  )
  return c.json({ data: result })
})

export default app
