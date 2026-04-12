/**
 * Authentification Writer API — Authorization: Bearer saw_...
 */
import { createMiddleware } from 'hono/factory'
import { validateWriterApiKey } from '../services/writer-api-key.service.js'

export type WriterEnv = {
  Variables: {
    writerProfileId: string
  }
}

export const requireWriterApiKey = createMiddleware<WriterEnv>(async (c, next) => {
  const auth = c.req.header('Authorization')?.trim() ?? ''
  const m = /^Bearer\s+(saw_[a-f0-9]+)$/i.exec(auth)
  if (!m) {
    return c.json(
      { error: 'Clé API rédaction requise (Authorization: Bearer saw_…)', code: 'WRITER_AUTH' },
      401,
    )
  }
  const profileId = await validateWriterApiKey(m[1])
  if (!profileId) {
    return c.json({ error: 'Clé API invalide ou révoquée.', code: 'WRITER_AUTH_INVALID' }, 401)
  }
  c.set('writerProfileId', profileId)
  await next()
})
