import type { Context, Next } from 'hono'
import { getReaderAuthUser } from '../lib/reader-auth.js'
import { getBearerToken } from '../lib/auth.js'
import { config } from '../config/env.js'
import { logger } from '../lib/logger.js'

export async function requireReaderAuth(c: Context, next: Next) {
  const path = c.req.path
  const token = getBearerToken(c)

  if (!token) {
    logger.authFail(path, 'NO_TOKEN', 'Missing Authorization: Bearer header')
    return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
  }

  if (!config.auth0) {
    return c.json(
      {
        error: 'Reader auth not configured',
        code: 'CONFIG',
        hint: 'Set AUTH0_DOMAIN and AUTH0_AUDIENCE',
      },
      503,
    )
  }

  const user = await getReaderAuthUser(c)
  if (!user) {
    logger.authFail(path, 'INVALID_TOKEN', 'Not a valid API token for reader routes')
    return c.json({ error: 'Unauthorized', code: 'INVALID_READER_TOKEN' }, 401)
  }

  c.set('reader' as never, user as never)
  await next()
}
