/**
 * Admin media routes — image upload, URL registration, listing, deletion.
 *
 * - POST   /upload    — upload image file to Supabase Storage
 * - POST   /url       — register an external image URL
 * - GET    /          — list all media (paginated)
 * - DELETE /:id       — delete media (storage + record)
 */
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { mediaUrlBodySchema } from '../../schemas/media.js'
import * as mediaService from '../../services/media.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth)
app.use('*', requireRole('journalist', 'editor', 'manager', 'admin'))

/* --- Upload image file --- */
app.post('/upload', async (c) => {
  const user = c.get('user')
  const body = await c.req.parseBody()
  const file = body['file']
  const alt = typeof body['alt'] === 'string' ? body['alt'] : undefined
  const caption = typeof body['caption'] === 'string' ? body['caption'] : undefined

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'File is required (multipart form, field: "file")' }, 400)
  }

  // Validate file type
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  if (!allowed.includes(file.type)) {
    return c.json({ error: `Invalid file type: ${file.type}. Allowed: ${allowed.join(', ')}` }, 400)
  }

  // Max 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'File too large (max 5 MB)' }, 400)
  }

  const media = await mediaService.uploadImage(file, file.name, user.id, { alt, caption })
  return c.json({ data: media }, 201)
})

/* --- Register external URL --- */
app.post('/url', async (c) => {
  const user = c.get('user')
  const parsed = mediaUrlBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 400)
  }
  const media = await mediaService.registerImageUrl(parsed.data.url, user.id, {
    alt: parsed.data.alt,
    caption: parsed.data.caption,
  })
  return c.json({ data: media }, 201)
})

/* --- List media --- */
app.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1
  const limit = Math.min(Number(c.req.query('limit')) || 30, 100)
  const { data, total } = await mediaService.listMedia({ page, limit })
  return c.json({ data, total })
})

/* --- Delete media --- */
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const ok = await mediaService.deleteMedia(id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
