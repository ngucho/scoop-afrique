import type { Context, Next } from 'hono'
import {
  inspectTokenForReaderRoutes,
  readAccessTokenSub,
  summarizeAccessTokenForLogs,
} from '../lib/auth0.js'
import { getBearerToken } from '../lib/auth.js'
import { config } from '../config/env.js'
import { logger } from '../lib/logger.js'
import { ensureReaderRoleViaManagement } from '../lib/reader-role-bootstrap.js'

const SESSION_REFRESH_NEEDED = 'SESSION_REFRESH_NEEDED' as const

function readerUnauthorized(
  c: Context,
  reason: string | undefined,
  devHint: string | undefined,
  status: 401 | 503 = 401,
) {
  if (status === 503) {
    return c.json(
      config.nodeEnv === 'production'
        ? { error: 'Service unavailable' }
        : {
            error: 'Reader auth not configured',
            code: 'CONFIG',
            hint: 'Set AUTH0_DOMAIN and AUTH0_AUDIENCE',
          },
      503,
    )
  }

  if (config.nodeEnv === 'production') {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json(
    {
      error: 'Unauthorized',
      code: 'INVALID_READER_TOKEN',
      reason,
      hint: devHint,
    },
    401,
  )
}

function sessionRefreshResponse(c: Context) {
  return c.json(
    {
      error: 'Unauthorized',
      code: SESSION_REFRESH_NEEDED,
    },
    401,
  )
}

export async function requireReaderAuth(c: Context, next: Next) {
  const path = c.req.path
  const token = getBearerToken(c)

  if (!token) {
    logger.authFail(path, 'NO_TOKEN', 'Missing Authorization: Bearer header')
    if (config.nodeEnv === 'production') {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
  }

  if (!config.auth0) {
    return readerUnauthorized(c, undefined, undefined, 503)
  }

  const auth = inspectTokenForReaderRoutes(token)
  if (auth.ok) {
    c.set('reader' as never, auth.user as never)
    await next()
    return
  }

  const tokenInfo = summarizeAccessTokenForLogs(token)
  logger.authFail(path, 'INVALID_READER_TOKEN', undefined, {
    reason: auth.reason,
    decode_ok: tokenInfo.decode_ok,
    token_summary: tokenInfo.summary,
  })

  if (auth.reason === 'TOKEN_MISSING_API_PERMISSIONS') {
    const sub = readAccessTokenSub(token)
    if (sub) {
      const bootstrap = await ensureReaderRoleViaManagement(sub)
      // Nouveau rôle : le client doit rafraîchir le jeton pour voir `permissions`.
      // Rôle déjà présent mais `permissions` vide : souvent jeton émis avant RBAC ou config API ;
      // même réponse pour forcer un refresh une fois côté client (voir docs/AUTH0_SETUP §10).
      if (bootstrap === 'assigned' || bootstrap === 'already_had_reader') {
        return sessionRefreshResponse(c)
      }
    }
  }

  const devHint =
    auth.reason === 'TOKEN_MISSING_API_PERMISSIONS'
      ? 'Jeton sans permission API — en prod le rôle reader est attribué automatiquement si AUTH0_READER_ROLE_ID et Management API sont configurés ; sinon vérifier RBAC Auth0 (docs/AUTH0_SETUP.md §10–11).'
      : auth.reason === 'AUDIENCE_MISMATCH'
        ? 'Vérifier AUTH0_AUDIENCE côté backend et audience demandée par le client reader.'
        : undefined

  return readerUnauthorized(c, auth.reason, devHint, 401)
}
