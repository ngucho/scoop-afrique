/**
 * Public offline contract.
 *
 * The frontend/service worker uses this compact manifest to decide which
 * articles changed and which full article JSON URLs should be cached.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import * as offlineService from '../services/offline.service.js'
import { isNotModified, setConditionalCacheHeaders, weakEtag } from '../lib/http-cache.js'

const app = new Hono()

const manifestQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
})

app.get('/manifest', async (c) => {
  const parsed = manifestQuerySchema.safeParse({
    limit: c.req.query('limit') ?? undefined,
  })
  if (!parsed.success) {
    return c.json({ error: 'Invalid query', details: parsed.error.flatten() }, 400)
  }

  const manifest = await offlineService.getOfflineManifest({ limit: parsed.data.limit })
  const cacheMetadata = {
    etag: weakEtag(['offline-manifest', manifest.max_updated_at, manifest.items.length]),
    lastModified: manifest.max_updated_at ? new Date(manifest.max_updated_at).toUTCString() : null,
    cacheControl: 'public, max-age=60, stale-while-revalidate=600',
  }
  setConditionalCacheHeaders(c, cacheMetadata)
  if (isNotModified(c.req.raw.headers, cacheMetadata)) return c.body(null, 304)
  return c.json({ data: manifest })
})

export default app
