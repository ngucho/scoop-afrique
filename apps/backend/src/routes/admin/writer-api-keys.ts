/**
 * Gestion des clés API Writer (profil connecté uniquement).
 */
import { z } from 'zod'
import { Hono } from 'hono'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { config } from '../../config/env.js'
import * as writerKeys from '../../services/writer-api-key.service.js'
import type { AppEnv } from '../../types.js'

const app = new Hono<AppEnv>()

app.use('*', requireAuth)
app.use('*', requireRole('journalist', 'editor', 'manager', 'admin'))

function requireDatabase(c: import('hono').Context) {
  if (!config.database) {
    return c.json({ error: 'Database not configured', code: 'CONFIG' }, 503)
  }
  return null
}

const createBody = z.object({
  label: z.string().max(120).optional(),
})

app.get('/', async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const rows = await writerKeys.listWriterApiKeys(user.id)
  return c.json({ data: rows })
})

app.post('/', async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const parsed = createBody.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)
  }
  const created = await writerKeys.createWriterApiKey(user.id, parsed.data.label ?? 'Clé')
  if (!created) return c.json({ error: 'Could not create key' }, 500)
  return c.json(
    {
      data: {
        id: created.id,
        key_prefix: created.key_prefix,
        /** Afficher une seule fois — non stockée en clair. */
        raw_key: created.raw_key,
      },
    },
    201,
  )
})

app.delete('/:id', async (c) => {
  const dbErr = requireDatabase(c)
  if (dbErr) return dbErr
  const user = c.get('user')
  const id = c.req.param('id')
  const ok = await writerKeys.revokeWriterApiKey(id, user.id)
  if (!ok) return c.json({ error: 'Not found' }, 404)
  return c.body(null, 204)
})

export default app
