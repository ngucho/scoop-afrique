import type { Context, Next } from 'hono'
import {
  inspectTokenForReaderRoutes,
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
      {
        error: 'Authentication provider unavailable',
        code: 'CONFIG',
        ...(config.nodeEnv !== 'production' && {
          hint: 'Set AUTH0_DOMAIN and AUTH0_AUDIENCE',
        }),
      },
      503,
    )
  }
  return c.json(
    {
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
      ...(config.nodeEnv !== 'production' && { reason, hint: devHint }),
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

export function createRequireReaderAuth(
  dependencies = {
    inspect: inspectTokenForReaderRoutes,
    ensureRole: ensureReaderRoleViaManagement,
    isAuth0Configured: () => config.auth0 !== null,
  },
) {
  return async function requireReaderAuth(c: Context, next: Next) {
    const path = c.req.path
    const token = getBearerToken(c)

    if (!token) {
      logger.authFail(path, 'NO_TOKEN', 'Missing Authorization: Bearer header')
      if (config.nodeEnv === 'production') {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      return c.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, 401)
    }
    if (!dependencies.isAuth0Configured()) {
      return readerUnauthorized(c, undefined, undefined, 503)
    }

    const auth = await dependencies.inspect(token)
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

    if (auth.reason === 'AUTH_PROVIDER_UNAVAILABLE') {
      return c.json(
        {
          error: 'Authentication provider unavailable',
          code: 'AUTH_PROVIDER_UNAVAILABLE',
        },
        503,
      )
    }

    if (
      auth.reason === 'TOKEN_MISSING_API_PERMISSIONS' &&
      auth.verifiedSub
    ) {
      const bootstrap = await dependencies.ensureRole(auth.verifiedSub)
      if (bootstrap === 'assigned' || bootstrap === 'already_had_reader') {
        return sessionRefreshResponse(c)
      }
    }

    const devHint =
      auth.reason === 'TOKEN_MISSING_API_PERMISSIONS'
        ? 'Jeton sans permission API — vérifier RBAC Auth0 et renouveler la session.'
        : auth.reason === 'AUDIENCE_MISMATCH'
          ? 'Vérifier AUTH0_AUDIENCE côté backend et côté client reader.'
          : undefined

    return readerUnauthorized(c, auth.reason, devHint, 401)
  }
}

export const requireReaderAuth = createRequireReaderAuth()
