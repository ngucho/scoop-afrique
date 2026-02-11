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

const app = new Hono()

/* --- List published articles --- */
app.get('/', async (c) => {
  if (!config.supabase) return c.json({ data: [], total: 0 })
  const category = c.req.query('category')
  const q = c.req.query('q')
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
  // Cache article lists for 30s, serve stale for 5 min while revalidating
  c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
  return c.json({ data, total, page, limit })
})

/* --- Get single article (view tracking) --- */
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await getAuthUser(c)
  const onlyPublished = !user
  const article = await articleService.getArticleByIdOrSlug(id, onlyPublished)
  if (!article) return c.json({ error: 'Not found' }, 404)

  // Fire-and-forget view count increment for published articles
  if (article.status === 'published') {
    articleService.incrementViewCount(article.id).catch(() => {})
  }

  // Cache single articles for 60s, stale for 10 min
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  return c.json({ data: article })
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
